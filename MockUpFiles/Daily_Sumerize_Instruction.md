# Tài liệu hướng dẫn tóm tắt Context _/Summerizing Instruction_

## Giới thiệu

Tài liệu này và một tài liệu khác về System promt instruction là 2 tài liệu quan trọng để quyết định hành vi và cách mô hình giao tiếp với người dùng.

## Tổng quan

Thứ tự chuỗi _REQUEST_ tới model (phần message của payload)

- _System - Core Prefix Promt_: Quy định thông tin cơ bản hành cho model, hành vi, ngữ điệu, hướng dẫn tool v.v. (Nằm trong một file khác)
- _System - Task Manager Promt_: Quản lý các tác vụ đang cần làm của promt; các tác vụ có chia cấp bậc và chia loại (Phần này sẽ làm rõ ở bên dưới)
- _System Sumerizing Promt_: Tóm tắt lịch sử chat. Các đoạn chat càng mới sẽ mô tả càng chi tiết (Phần này sẽ làm rõ ở bên dưới)
- _User & Model_: Đoạn chat của ngời dùng và model (8 tin nhắn mới nhất của người dùng hoặc model sẽ được giữ nguyên và không cần nén)

## Chi tiết

### _[Task Manager Promt]_

**Phân loại tác vụ /Task archetype**

- User-Based: Tác vụ do người dùng hành động (_ACTIONS_). model chỉ đóng vai trò trò chuyện (_COMMUNE_), tư vấn và trao đổi thông tin. Promt chain sẽ chỉ có một cấp độ (Hoặc coi như không có promt chain): Model trả lời > xong 1 chain > người dùng hỏi > xong 1 chain >...> Xong task

- Full-Model: Tác vụ hoàn toàn do model xử lý, Promt Chain vô hạn và có thêm tính năng _CHECKLIST_ (Mô tả kỹ bên dưới). Khi 1 task khởi tạo với loại này model sẽ tự lên danh sách _CHECKLIST_ (chi tiết và đơn giản) sau đó xử lý tuần tự từng _CHECKLIST_ cho đến khi hoàn thành task. Model có thể thực hiện cả ACTION lẫn _COMMUNE_ trong quá trình triển khai promt chain để hoàn thành task.

- Hybrid (Hoặc User in the Loop): Kết hợp của 2 loại trên. Sử dụng trong trường hợp 1 tác vụ chia ra làm các tác vụ nhỏ hơn (_CHECKLIST_). Khi 1 task khởi tạo với loại này model sẽ tự lên danh sách _CHECKLIST_ và trong danh sách sẽ có nhưng _BREAKPOINT_. Model sẽ tự xử loop và xử lý các check list cho đến khi gặp breakpoint > Thông báo tới người dùng và yêu cầu bổ sung thông tin hoặc xác nhận.

**Các cấp độ của tác vụ /Task Leveling**

_Các task sẽ dược đánh ID, các ID sẽ có logic đặt tên để dễ dàng truy xuất_

- OBJECTIVE/TASK/CHECKLIST: Cấp độ theo độ phức tạp

  - _OBJECTIVE_: Cấp độ cao nhất, rất phức tạp và cần nhiều thời gian để hoàn thành. Luôn chia thành các _TASK_.
  - _TASK_: Cấp độ nhỏ hơn của _OBJECTIVE_. Có thể hoàn thành trong một ngày. Có thể chia nhỏ nhành _CHECKLIST_ hoặc không. TASK là cấp độ quan trọng nhất, model và người dùng cũng làm việc thông qua task nhiều nhất.
  - _CHECKLIST_: cấp độ nhỏ nhất, đơn giản tới mức model có thể tự hoàn thành. Ví dụ: Dùng 1 tools để Đọc thông tin 1 file trong máy tính, đặt báo thức, v.v.

- Year/Month/Day Level: Các cấp độ chia theo thời gian
  - _Year_: Thường sẽ ở Level _OBJECTIVE_ và không cần đưa vào phần system khi _REQUEST_. Nếu người dùng yêu cầu hoặc nhắc đến task 1 task cụ thể của năm xxxx thì ID của task này sẽ được @mention trong danh sách task của _Day_ và task này sẽ xuất hiện trong phần System. (Sau này chúng ta sẽ triển khai logic xử lý cho cấp độ task này).
  - _Month_: tương tự như _Year_ và triển khai sau.
  - _Day_: Khi người dùng request trong ngày, Luôn luôn đính kèm các task của ngày hôm đó trong _REQUEST_ kể cả các task đã hoàn thành trong ngày. Task của ngày trong quá khứ cũng có thể được đính kèm nếu trong ngày hiện tại chúng ta @mention.

### _[Summerizing Service]_

**1. Trigger by TOKEN COUNT**

Giới hạn token của chúng ra hiện tại là 12288 (~12k) token; chúng ta sẽ dùng chính model WENDY hiện tại để summerize context (tuy chung model nhưng khác service, SummerizeService sẽ có phần system promt tối tưu để hướng dẫn model tóm tắt chính xác)

Chúng ta sẽ nén trong background, với 2 breakpoint là 3k (floor) và 7.8k (ceiling). Hãy đặt 2 thông số này ở vị trí dễ tìm thấy để chúng ta có thể sửa sau này.

Khi 1 request gửi tới server vượt ngưỡng ceil, server vẫn xử lý request đó và trả về tin nhắn bình thường. Sau khi trả lời tin nhắn, server sẽ tiến hành summerize về ngưỡng xấp xỉ floor.

> Công việc hiện tại: Tìm trường thông tin của token Count trong response của Model (Thử log 1 tin nhắn); ước lượng số ký tự tối đa để đoạn văn sau khi summerize không vượt ngưỡng floor.

**2. Summerizing Logics**

Cách thức tóm tắt cơ bản có 2 quy tắc chính như sau: "Mới nhất giữ nguyên", "Càng cũ càng tóm gọn".

- Mới nhất giữ nguyên: 8 Tin nhắn gần nhất tính cả người dùng và model sẽ giữ nguyên.

- Càng cũ càng tóm gọn:

Ví dụ cho 1 đoạn _System Sumerizing Promt_:
`Prefix Promt và Task Manager Promt`+
[*Tháng này* Boss đã cải thiện kỹ năng tiếng Anh và đang tích cực hoàn thiện WENDY] [*Hôm nay* Boss nhấn mạnh là muốn hoàn thành tính năng quản lý lưu trữ. Buổi sang Boss đã đi làm công việc văn phòng hàng ngày, quên uống Cacao buổi sáng, mua đồ ăn trưa vượt quá Budget, chiều đã bổ sung lại Cacao với creatine để tập gym vào buổi chiều, buổi tập vai 1tiếng đồng hồ khá hiệu quả và ra mồ hôi] [*Hiện tại* Boss đang tiếp tục triển khai dự án WENDY `Đoạn này sẽ mô tả tuần tự thật kỹ những gì đã và đang làm`] +`Lịch sử chat 8 tin nhắn gần nhất`

**3. Summerizing File Structure**
Daily_summary.json và Daily_chat.json là 2 file riêng biệt:

- Daily_chat lưu trữ lịch sử chat cơ bản và dùng để LazyLoad trong UI
- Daily_summary.json: lưu trữ các đoạn tóm tắt cùng dấu thời gian, khoảng thời gian mà đoạn tóm tắt đó đại diện (Phần này chúng ta vẫn phải bàn luận để tìm ra cấu trúc tối ưu)

> Công việc: Tối ưu cấu trúc file Daily_summary

**4. Special Notes**

- Có hiển thị trạng thái đang nén trên UI. Trong lúc đang nén, client UIvẫn có thể soạn tin nhắn, nhưng phải chờ tới khi nén xong mới có thể request tiếp.

- chúng ta sẽ lưu PromtVersion để sau này khi năng cấp sẽ dễ dàng trace back và convert từ bản cũ lên bản mới.
