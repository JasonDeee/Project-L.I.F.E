# Tài liệu hướng dẫn tóm tắt Context _/Summerizing Instruction_

## Giới thiệu

Tài liệu này và một tài liệu khác về System promt instruction là 2 tài liệu quan trọng để quyết định hành vi và cách mô hình giao tiếp với người dùng.

## Tổng quan

Thứ tự chuỗi request tới model (phần message của payload)

- System - Core Prefix Promt: Quy định thông tin cơ bản hành cho model, hành vi, ngữ điệu, hướng dẫn tool v.v. (Nằm trong một file khác)
- System - Task Manager Promt: Quản lý các tác vụ đang cần làm của promt; các tác vụ có chia cấp bậc và chia loại (Phần này sẽ làm rõ ở bên dưới)
- System - Sumerizing Promt: Tóm tắt lịch sử chat. Các đoạn chat càng mới sẽ mô tả càng chi tiết (Phần này sẽ làm rõ ở bên dưới)
- User & Model: Đoạn chat của ngời dùng và model (8 tin nhắn mới nhất của người dùng hoặc model sẽ được giữ nguyên và không cần nén)

## Chi tiết

### _[Task Manager Promt]_

**Phân loại tác vụ /Task archetype**

- User-Based: Tác vụ do người dùng hành động (_ACTIONS_). model chỉ đóng vai trò trò chuyện (_COMMUNE_), tư vấn và trao đổi thông tin. Promt chain sẽ chỉ có một cấp độ (Hoặc coi như không có promt chain): Model trả lời > xong 1 chain > người dùng hỏi > xong 1 chain >...> Xong task

- Full-Model: Tác vụ hoàn toàn do model xử lý, Promt Chain vô hạn. Model sẽ tự gọi lại chính nó để xử lý task cho đến khi hoàn thành. Model có thể thực hiện cả ACTION lẫn _COMMUNE_ trong quá trình triển khai promt chain để hoàn thành task.

- Hybrid (Hoặc User in the Loop): Kết hợp của 2 loại trên, và có thêm tính năng _CHECKLIST_ (Mô tả kỹ bên dưới). Sử dụng trong trường hợp 1 tác vụ chia ra làm các tác vụ nhỏ hơn (**CHECKLIST**). Trong quá trình xử lý 1 task, sẽ có những _CHECKLIST_ model có thể tự xử lý. Tương tự sẽ có những _CHECKLIST_ chỉ có thể do người dùng xử lý hoặc cần sự đồng ý của người dùng.

**Các cấp độ của tác vụ /Task Leveling**

- Year/month/day Level: Các cấp độ chia theo thời gian
