# BẢN THIẾT KẾ HỆ THỐNG (SYSTEM DESIGN DRAFT v2.0 — CHUẨN PTIT)
**Đề tài:** Hệ thống Thương mại Điện tử Thời trang tích hợp Tìm kiếm Đa phương thức, AI Stylist Cá nhân hóa & Thử đồ trực tiếp (Wearson AI)  
**Cấu trúc chuẩn:** Bám sát 100% khung phương pháp luận môn *Phân tích và Thiết kế Hệ thống Thông tin — PTIT* (`tt_nhichu.pdf`) và danh mục yêu cầu tại **Ảnh 1**.

> [!IMPORTANT]
> **Các quy tắc cốt lõi đã chuẩn hóa trong bản v2.0 này:**
> 1. **Actor chỉ là người thực:** Chỉ gồm 2 Actor con người là **`Customer`** và **`Admin`** (Tuyệt đối không đưa các dịch vụ AI hay hệ thống kỹ thuật làm Actor).
> 2. **Đầy đủ bộ FR1–FR12 theo Ảnh 1 + Mở rộng AI Stylist & Wearson AI:** Bao gồm cả chức năng gõ mã đơn vào thanh tìm kiếm để tra cứu đơn hàng (`FR6`, `FR7`), cơ chế tự động **nới lỏng bộ lọc (Relax Hard Filter $\rightarrow$ Soft Preference)** khi có ít hơn 3 kết quả, và 3 chức năng quản trị của Admin (`FR9`, `FR10`, `FR11`).
> 3. **Đủ toàn bộ quy trình & biểu đồ như `tt_nhichu.pdf`:** Kịch bản chuẩn & ngoại lệ $\rightarrow$ Activity Diagram $\rightarrow$ 5 bước trích Entity Class $\rightarrow$ Analysis Class Diagram (Entity + View `in/out/sub` + Control + 4 câu hỏi gán hàm) $\rightarrow$ Sequence Phân tích $\rightarrow$ Kiến trúc 3 Layer & 4 Package (`interface`, `controller`, `DAO`, `model`) $\rightarrow$ 4 bước thiết kế Entity $\rightarrow$ 5 bước thiết kế CSDL & ERD $\rightarrow$ Design Class Diagram (kèm Interface Realization) $\rightarrow$ Sequence Thiết kế $\rightarrow$ Ma trận ánh xạ Code.

---

# PHẦN I: YÊU CẦU HỆ THỐNG (REQUIREMENTS)

## 1. Mô tả hệ thống bằng ngôn ngữ tự nhiên

### 1.1. Tổng quan
Hệ thống **MaisonAI (SmartFashion)** là một website thương mại điện tử bán lẻ thời trang trực tuyến, cho phép khách hàng tìm kiếm sản phẩm bằng **từ khóa văn bản**, **giọng nói** hoặc **hình ảnh**, đồng thời cung cấp **AI Stylist cá nhân hóa** giúp phân tích vóc dáng từ ảnh chụp trực tiếp, thu thập mong muốn (qua bộ câu hỏi mẫu hoặc nói qua micro), tự động phối nhiều bộ trang phục (**Costumes/Outfits**) từ kho hàng và ướm thử trực tiếp lên người dùng thông qua **Wearson AI**.

### 1.2. Các Actor (Chỉ gồm con người thực)

| STT | Actor | Vai trò | Chức năng chính |
|---|---|---|---|
| 1 | **Customer** | Khách mua hàng | Đăng nhập/đăng xuất, tìm sản phẩm bằng từ khóa/giọng nói/hình ảnh, nhận kết quả xếp hạng theo độ phù hợp, sử dụng AI Stylist phối đồ & thử đồ trực tiếp (Wearson AI), xem chi tiết sản phẩm, quản lý giỏ hàng, thanh toán đơn hàng, tìm kiếm và xem chi tiết đơn hàng. |
| 2 | **Admin** | Quản trị viên | Đăng nhập/đăng xuất, quản lý sản phẩm (thêm/sửa/xóa/tồn kho), quản lý danh mục (cây danh mục cha-con), quản lý và cập nhật trạng thái đơn hàng. |

### 1.3. Bảng Yêu cầu Chức năng (Chuẩn hóa theo Ảnh 1 + Mở rộng AI Stylist)

#### A. Nhóm Actor: `Customer` (Khách mua hàng)
| Mã FR | Tên tiếng Việt | Tên Use Case tiếng Anh | Mô tả chi tiết |
|---|---|---|---|
| **FR1** | Tìm sản phẩm bằng từ khóa | `Search by Keyword` | Nhập câu mô tả tự nhiên (VD: *"áo sơ mi trắng dưới 1.5 triệu"*); hệ thống bóc tách hard filter (danh mục, màu, giá) và soft preference (phong cách, mùa, chất liệu). |
| **FR2** | Tìm sản phẩm bằng giọng nói | `Search by Voice` | Bật micro hoặc dùng phím tắt Mumble Voice (`Ctrl + Space`) để nói yêu cầu bằng tiếng Việt; hệ thống chuyển thành chữ rồi tìm kiếm. |
| **FR3** | Tìm sản phẩm bằng hình ảnh | `Search by Image` | Tải ảnh trang phục lên (có thể chọn vùng trang phục trên ảnh hoặc dùng toàn ảnh) để tìm sản phẩm có đặc trưng hình ảnh giống nhất. |
| **FR4** | Xếp hạng kết quả theo độ phù hợp | `Search Product` | Use case tổng quát kết hợp lọc cứng (hard filter), nới lỏng filter nếu `< 3` kết quả, tìm trên `KeywordIndex` & `VectorIndex`, xếp hạng kèm nhãn giải thích. |
| **FR5** | Xem chi tiết sản phẩm | `View Product` | Xem ảnh, giá, màu sắc, kích cỡ, chất liệu, số lượng tồn kho và các thông tin bảo quản của sản phẩm. |
| **FR6** | Tìm kiếm đơn hàng | `Search Order` | Nhập mã đơn hàng (VD: `SF-2026-0038`) trực tiếp vào ô tìm kiếm hoặc khung tra cứu để tìm nhanh đơn hàng. |
| **FR7** | Xem chi tiết đơn hàng | `View Order` | Xem danh sách sản phẩm đã đặt, số lượng, đơn giá lúc mua, phí vận chuyển, tổng tiền và trạng thái xử lý của đơn hàng. |
| **FR8** | Thanh toán đơn hàng | `Make Payment` | Điền thông tin giao nhận, chọn phương thức thanh toán (COD / VNPay / MoMo), kiểm tra & trừ tồn kho để tạo đơn hàng. |
| **FR13** *(Mở rộng)* | Tư vấn phối đồ cùng AI Stylist | `Consult AI Stylist` | Khách chụp ảnh trực tiếp (hoặc tải ảnh toàn thân), sau đó trả lời **3–4 câu hỏi có phương án mẫu** HOẶC **bật mic nói tự do**; AI phân tích vóc dáng + mong muốn để phối **2–3 bộ Costume** từ sản phẩm trong shop. |
| **FR14** *(Mở rộng)* | Thử đồ trực tiếp với Wearson AI | `Virtual Try-On Costume` | Chọn một bộ Costume (hoặc món đồ) vừa được AI phối để **Wearson AI** ghép trực tiếp lên bức ảnh của khách hàng. |

#### B. Nhóm Actor: `Admin` (Quản trị viên)
| Mã FR | Tên tiếng Việt | Tên Use Case tiếng Anh | Mô tả chi tiết |
|---|---|---|---|
| **FR9** | Quản lý sản phẩm | `Manage Product` | Thêm mới, cập nhật thông tin, giá bán, biến thể màu/size và điều chỉnh số lượng tồn kho sản phẩm. |
| **FR10** | Quản lý danh mục | `Manage Category` | Thêm mới, sửa, xóa và tổ chức cấu trúc cây danh mục cha – danh mục con. |
| **FR11** | Quản lý đơn hàng | `Manage Order` | Xem danh sách đơn đặt hàng, lọc theo trạng thái và cập nhật tiến trình đơn (`Mới tạo` $\rightarrow$ `Đã xác nhận` $\rightarrow$ `Đang giao` $\rightarrow$ `Hoàn tất`). |

#### C. Dùng chung cho cả hai Actor (`Customer` & `Admin`)
| Mã FR | Tên tiếng Việt | Tên Use Case tiếng Anh | Mô tả chi tiết |
|---|---|---|---|
| **FR12** | Đăng nhập, đăng xuất | `Login · Logout` | Xác thực tài khoản theo phân quyền (`customer` hoặc `admin`) và đăng xuất khỏi phiên làm việc. |

---

## 2. Biểu đồ Use Case (Use Case Diagrams)

### 2.1. Use Case Diagram 1 — Tổng quát toàn hệ thống
Chỉ đặt **2 Actor con người (`Customer` và `Admin`)** quanh System Boundary `SmartFashion E-Commerce System`:

```mermaid
flowchart LR
    Customer(["👤 Customer\n(Khách mua hàng)"])
    Admin(["👤 Admin\n(Quản trị viên)"])

    subgraph Boundary ["SmartFashion E-Commerce System"]
        direction TB
        %% Nhóm Tìm kiếm (FR1 - FR4)
        UC_Search("FR4: Search Product\n(Xếp hạng theo độ phù hợp)")
        UC_Keyword("FR1: Search by Keyword\n(Tìm bằng từ khóa)")
        UC_Voice("FR2: Search by Voice\n(Tìm bằng giọng nói)")
        UC_Image("FR3: Search by Image\n(Tìm bằng hình ảnh)")

        %% Nhóm AI Stylist & Wearson Try-On (FR13 - FR14)
        UC_Stylist("FR13: Consult AI Stylist\n(Phối bộ Costume theo dáng & nhu cầu)")
        UC_TryOn("FR14: Virtual Try-On Costume\n(Thử đồ trực tiếp Wearson AI)")

        %% Nhóm Mua sắm & Đơn hàng của Customer (FR5 - FR8)
        UC_ViewProd("FR5: View Product\n(Xem chi tiết sản phẩm)")
        UC_SearchOrder("FR6: Search Order\n(Tìm kiếm đơn hàng)")
        UC_ViewOrder("FR7: View Order\n(Xem chi tiết đơn hàng)")
        UC_Payment("FR8: Make Payment\n(Thanh toán đơn hàng)")

        %% Dùng chung (FR12)
        UC_Auth("FR12: Login · Logout\n(Đăng nhập, đăng xuất)")

        %% Nhóm Quản trị của Admin (FR9 - FR11)
        UC_MngProd("FR9: Manage Product\n(Quản lý sản phẩm)")
        UC_MngCat("FR10: Manage Category\n(Quản lý danh mục)")
        UC_MngOrd("FR11: Manage Order\n(Quản lý đơn hàng)")
    end

    %% Liên kết của Customer
    Customer --> UC_Search
    Customer --> UC_Stylist
    Customer --> UC_ViewProd
    Customer --> UC_SearchOrder
    Customer --> UC_ViewOrder
    Customer --> UC_Payment
    Customer --> UC_Auth

    %% Generalization của Search Product
    UC_Keyword -. "Generalization ◁" .-> UC_Search
    UC_Voice -. "Generalization ◁" .-> UC_Search
    UC_Image -. "Generalization ◁" .-> UC_Search

    %% Quan hệ mở rộng / bao gồm của AI Stylist
    UC_TryOn -. "«extend»" .-> UC_Stylist

    %% Liên kết của Admin
    Admin --> UC_Auth
    Admin --> UC_MngProd
    Admin --> UC_MngCat
    Admin --> UC_MngOrd
```

### 2.2. Use Case Diagram 2 — Đi sâu Module Tìm kiếm & AI Stylist Phối đồ

```mermaid
flowchart LR
    Customer(["👤 Customer"])

    subgraph Search_And_Stylist_Module ["Module Trọng tâm: Multimodal Search & AI Stylist Studio"]
        UC_Search("Search Product")
        UC_Keyword("Search by Keyword")
        UC_Voice("Search by Voice")
        UC_Image("Search by Image")

        UC_Stylist("Consult AI Stylist")
        UC_Capture("Capture Body Photo")
        UC_Intent("Specify Styling Intent")
        UC_Quiz("Answer Guided Questions (3-4 câu)")
        UC_SpeakIntent("Speak Intent via Mic")
        UC_TryOn("Virtual Try-On (Wearson AI)")

        UC_ViewProd("View Product")
        UC_AddCart("Add to Cart / Add Full Costume")
        UC_SearchOrder("Search Order")
    end

    Customer --> UC_Search
    Customer --> UC_Stylist
    Customer --> UC_ViewProd
    Customer --> UC_AddCart
    Customer --> UC_SearchOrder

    UC_Keyword -. "◁ Generalization" .-> UC_Search
    UC_Voice -. "◁ Generalization" .-> UC_Search
    UC_Image -. "◁ Generalization" .-> UC_Search

    UC_Stylist ==>|"«include»"| UC_Capture
    UC_Stylist ==>|"«include»"| UC_Intent
    UC_Quiz -. "◁ Generalization" .-> UC_Intent
    UC_SpeakIntent -. "◁ Generalization" .-> UC_Intent
    UC_TryOn -. "«extend»" .-> UC_Stylist
```

### 2.3. Bảng Mô tả các Use Case (Chuẩn câu mô tả PTIT)

| Tên Use Case | Mô tả chuẩn ("Use case này cho phép...") |
|---|---|
| **Search Product (FR4)** | Use case này cho phép `Customer` tìm sản phẩm theo nhu cầu và nhận danh sách sản phẩm đã xếp hạng theo độ phù hợp kèm nhãn giải thích. |
| **Search by Keyword (FR1)** | Use case này cho phép `Customer` gõ câu mô tả tự nhiên để lọc cứng (danh mục, màu, giá) và xếp hạng sản phẩm phù hợp nhất. |
| **Search by Voice (FR2)** | Use case này cho phép `Customer` nói yêu cầu qua micro (Mumble Voice/Web Speech), hệ thống chuyển giọng nói thành văn bản tiếng Việt rồi tìm sản phẩm. |
| **Search by Image (FR3)** | Use case này cho phép `Customer` tải ảnh lên (chọn vùng trang phục hoặc toàn ảnh) để tìm sản phẩm có đặc trưng hình ảnh giống nhất. |
| **Consult AI Stylist (FR13)** | Use case này cho phép `Customer` chụp ảnh cơ thể và chia sẻ mong muốn (qua 3–4 câu hỏi mẫu hoặc nói qua mic) để AI phân tích vóc dáng và phối nhiều bộ Costume từ kho hàng. |
| **Virtual Try-On Costume (FR14)** | Use case này cho phép `Customer` ướm thử trực tiếp bộ Costume hoặc sản phẩm đã chọn lên bức ảnh cơ thể của mình bằng Wearson AI. |
| **View Product (FR5)** | Use case này cho phép `Customer` xem thông tin chi tiết, biến thể màu/size và tồn kho của một sản phẩm. |
| **Search Order (FR6)** | Use case này cho phép `Customer` nhập mã đơn hàng vào thanh tìm kiếm hoặc ô tra cứu để tìm nhanh đơn hàng của mình. |
| **View Order (FR7)** | Use case này cho phép `Customer` xem chi tiết trạng thái, danh sách món đồ và tổng tiền của đơn hàng. |
| **Make Payment (FR8)** | Use case này cho phép `Customer` đặt mua các sản phẩm trong giỏ và thực hiện thanh toán đơn hàng. |
| **Manage Product (FR9)** | Use case này cho phép `Admin` thêm mới, chỉnh sửa thông tin và cập nhật số lượng tồn kho của sản phẩm. |
| **Manage Category (FR10)** | Use case này cho phép `Admin` tạo và quản lý danh mục sản phẩm theo cấu trúc cha – con. |
| **Manage Order (FR11)** | Use case này cho phép `Admin` theo dõi và cập nhật trạng thái xử lý của các đơn đặt hàng. |
| **Login · Logout (FR12)** | Use case này cho phép `Customer` và `Admin` đăng nhập vào hệ thống theo phân quyền và đăng xuất khi kết thúc phiên. |

---

# PHẦN II: PHÂN TÍCH HỆ THỐNG (SYSTEM ANALYSIS)

## 1. Xây dựng Kịch bản (Scenarios)

### 1.1. Kịch bản 1 (Chuẩn): Tìm sản phẩm bằng từ khóa (`FR1`, `FR4`, `FR5`)
1. **Khách hàng A** mở trang chủ để tìm mua một chiếc áo sơ mi.
2. **Hệ thống** hiển thị giao diện trang chủ gồm: ô tìm kiếm, nút micro, nút tải ảnh, nút Tìm và thanh danh mục.
3. **A** nhập câu *"áo sơ mi trắng dưới 2 triệu"* và nhấn nút Tìm.
4. **Hệ thống** phân tích câu, hiển thị các điều kiện đã hiểu (**Hard filters:** Danh mục = `Áo`, Màu = `Trắng`, Giá `< 2.000.000₫`), số lượng sản phẩm thỏa mãn và danh sách kết quả đã sắp xếp theo độ khớp kèm nhãn giải thích (VD: `Đúng danh mục Áo`, `Khớp màu trắng`, `Trong tầm giá`).
5. **A** nhấn vào sản phẩm đứng đầu danh sách (*"Sơ mi Linen Form Rộng"*).
6. **Hệ thống** hiển thị giao diện chi tiết sản phẩm gồm: bộ ảnh, giá bán, bảng màu, các kích cỡ (`XS, S, M, L`), trạng thái còn hàng và nút **Thêm vào túi**.
7. **A** chọn size `M` và nhấn **Thêm vào túi**.
8. **Hệ thống** cập nhật giỏ hàng và mở ngăn túi đồ thông báo đã thêm thành công.

### 1.2. Kịch bản 2: Tìm bằng giọng nói (`FR2`) và Tìm bằng hình ảnh (`FR3`)
*Chỉ khác kịch bản chuẩn ở **bước 3** và **bước 4**, các bước 5–8 giữ nguyên:*
- **Nhánh Giọng nói (`Search by Voice`):**
  - **Bước 3:** A nhấn nút Micro (hoặc giữ `Ctrl + Space` với Mumble Voice) và nói *"tôi muốn tìm blazer xám mặc đi làm"*.
  - **Bước 3a:** Hệ thống chuyển giọng nói thành văn bản *"tôi muốn tìm blazer xám mặc đi làm"* và điền vào ô tìm kiếm.
  - **Bước 4:** Hệ thống hiểu Hard filter (`Danh mục = Áo khoác`, `Màu = Xám`) và Soft preference (`Dịp = Công sở`), trả về các mẫu Blazer đứng đầu.
- **Nhánh Hình ảnh (`Search by Image`):**
  - **Bước 3:** A nhấn nút Tải ảnh và chọn một bức ảnh chụp street-style gồm áo khoác và quần.
  - **Bước 3a:** Hệ thống nhận diện các vùng trang phục trên ảnh (Áo khoác, Quần, Túi) và hiển thị khung chọn vùng (`ObjectSelectionView`). A nhấn chọn vùng chiếc **Áo khoác** (hoặc chọn dùng toàn ảnh).
  - **Bước 4:** Hệ thống mã hóa vùng ảnh đã chọn thành vector, trả về danh sách các mẫu áo khoác trong shop có kiểu dáng và màu sắc tương đồng nhất.

### 1.3. Kịch bản 3 (Đột phá): Tư vấn AI Stylist & Thử đồ trực tiếp Wearson AI (`FR13`, `FR14`)
1. **Khách hàng A** mở trang **AI Stylist & Phối đồ** để tìm các bộ trang phục hợp với vóc dáng của mình.
2. **Hệ thống** hiển thị khung chụp ảnh trực tiếp bằng Camera (hoặc tải ảnh toàn thân) và 2 lựa chọn chia sẻ mong muốn.
3. **A** chụp ảnh toàn thân trực tiếp từ webcam (hoặc chọn ảnh cá nhân).
4. **Hệ thống** phân tích nhanh bức ảnh, nhận diện đặc điểm hình thể (VD: *Dáng cân đối, tỷ lệ vai–hông hài hòa, hợp phom suông & chiết eo nhẹ*).
5. **A** chọn **1 trong 2 cách** cung cấp mong muốn:
   - **Cách 5a (Trả lời 4 câu hỏi mẫu):** A lần lượt bấm chọn các phương án mẫu: (1) Dịp: *Công sở & Gặp đối tác* $\rightarrow$ (2) Phong cách: *Thanh lịch, tối giản* $\rightarrow$ (3) Ưu tiên dáng: *Tôn vòng eo & Kéo dài chân* $\rightarrow$ (4) Ngân sách: *Dưới 5 triệu*.
   - **Cách 5b (Nói qua Mic / Mumble Voice):** A bật nút Mic (hoặc giữ `Ctrl + Space`) và nói: *"Phối giúp tôi mấy bộ đồ đi làm lịch sự, hiện đại, tôn dáng và che bắp tay, ngân sách tầm 5 triệu"*. Hệ thống phiên âm và trích xuất thành các tiêu chí tương đương.
6. **Hệ thống (`CostumeMixerService`)** kết hợp thông tin vóc dáng và mong muốn của A để tự động phối **3 bộ Costume hoàn chỉnh** từ các sản phẩm đang còn hàng trong shop (Mỗi bộ gồm: *Áo chủ đạo + Quần/Chân váy + Áo khoác/Phụ kiện*), kèm lời giải thích của Stylist AI cho từng bộ.
7. **A** ưng ý **Bộ Costume số 1** (*"Thành thị Thanh lịch"*: Blazer Xám đá + Sơ mi Linen Trắng + Quần âu Đen) và nhấn nút **"Thử trực tiếp bộ này với Wearson AI"**.
8. **Hệ thống (`WearsonTryOnService`)** ghép các món đồ trong Bộ Costume số 1 lên chính bức ảnh mà A đã chụp ở Bước 3 và hiển thị bản xem trước trực quan.
9. **A** hài lòng với hình ảnh mặc thử và nhấn **"Thêm cả bộ vào túi"**. Hệ thống thêm đồng thời cả 3 món đồ vào giỏ hàng.

### 1.4. Kịch bản 4: Các kịch bản Ngoại lệ (Exceptions — Theo chuẩn trang 13 `tt_nhichu.pdf`)
- **Ngoại lệ 1 (Quá ít kết quả $\rightarrow$ Nới lỏng Filter):** Ở Bước 4 của tìm kiếm, nếu áp dụng cả 3 hard filter (Danh mục + Màu sắc + Giá) mà có **ít hơn 3 sản phẩm** thỏa mãn (VD: *"váy lụa màu đỏ dưới 500k"*): Hệ thống tự động **bỏ hard filter Màu sắc**, giữ lại Danh mục và Giá để lấy đủ $\ge 3$ sản phẩm; đồng thời chuyển Màu sắc thành **Soft preference** (sản phẩm nào đúng màu đỏ vẫn được cộng điểm xếp lên đầu). Giao diện hiển thị thông báo: *"Đã nới lỏng bộ lọc màu sắc để hiển thị thêm các lựa chọn phù hợp"*.
- **Ngoại lệ 2 (Không có kết quả nào):** Sau khi đã nới lỏng filter mà vẫn có 0 sản phẩm $\rightarrow$ Hệ thống thông báo không tìm thấy và gợi ý các từ khóa/danh mục phổ biến.
- **Ngoại lệ 3 (Khách chủ động chọn bộ lọc trên UI):** Ở Bước 4, khách hàng bấm chọn lại bộ lọc Kích cỡ hoặc Khoảng giá trên thanh công cụ $\rightarrow$ Lựa chọn trực tiếp trên UI được ưu tiên ghi đè lên điều kiện trích xuất tự động từ câu tìm kiếm.
- **Ngoại lệ 4 (Sản phẩm hết hàng):** Ở Bước 6, nếu biến thể sản phẩm có `stock == 0` $\rightarrow$ Hệ thống hiển thị nhãn *"Hết hàng"* và vô hiệu hóa nút Thêm vào túi.

### 1.5. Kịch bản 5 (Phụ): Tra cứu đơn hàng trực tiếp (`FR6`, `FR7` — Theo chuẩn trang 14 `tt_nhichu.pdf`)
1. **Khách hàng A** nhập *"kiểm tra đơn hàng SF-2026-0038"* (hoặc gõ mã `SF-2026-0038`) vào ngay ô tìm kiếm và nhấn Tìm.
2. **Hệ thống** phát hiện chuỗi nhập chứa mẫu mã đơn hàng (`SF-YYYY-XXXX`), lập tức chuyển sang luồng **Tra cứu đơn hàng** thay vì tìm sản phẩm.
3. **Giao diện tra cứu đơn** hiển thị: Mã đơn `#SF-2026-0038`, ngày đặt, trạng thái hiện tại (`Đang giao`), danh sách từng sản phẩm kèm số lượng, đơn giá và tổng thanh toán.
4. *Ngoại lệ:* Nếu mã đơn không tồn tại $\rightarrow$ Giao diện thông báo *"Không tìm thấy đơn hàng với mã bạn vừa nhập"*.

---

## 2. Biểu đồ Hoạt động (Activity Diagrams)

### 2.1. Activity Diagram 1 — Luồng Tìm kiếm Đa phương thức, Tra cứu Đơn & Xử lý Ngoại lệ
Biểu đồ thể hiện rõ **Decision node `Search mode?`**, **Merge node**, nhận diện **Mã đơn hàng (`Order code?`)** và **3 Decision node ngoại lệ** (`Results < 3? Relax filter`, `Results found?`, `In stock?`):

```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenUI["Customer mở giao diện tìm kiếm (SearchUI)"]
    OpenUI --> ModeDecision{"Search mode?"}

    %% 3 nhánh nhập liệu
    ModeDecision -- "Keyword (FR1)" --> EnterText["Nhập câu tìm kiếm văn bản"]
    ModeDecision -- "Voice (FR2)" --> SpeakMic["Nói qua Mic / Mumble Voice (Ctrl+Space)"]
    SpeakMic --> Transcribe["Transcribe speech to text (Chuyển thành chữ)"]
    ModeDecision -- "Image (FR3)" --> UploadImg["Tải ảnh trang phục lên"]
    UploadImg --> DetectRegions["Nhận diện vùng đồ & chọn vùng (hoặc toàn ảnh)"]
    DetectRegions --> EncodeImg["Mã hóa ảnh thành image_embedding"]

    %% Kiểm tra tra cứu mã đơn hàng (FR6)
    EnterText --> CheckOrderCode{"Chứa mã đơn hàng?\n(VD: SF-2026-xxxx)"}
    Transcribe --> CheckOrderCode
    CheckOrderCode -- "Có (FR6, FR7)" --> LookupOrder["Tìm đơn hàng trong OrderRepository"]
    LookupOrder --> OrderExists{"Tìm thấy đơn?"}
    OrderExists -- "Không" --> ShowOrderNotFound["Báo không tìm thấy mã đơn hàng"] --> End([Kết thúc])
    OrderExists -- "Có" --> ShowOrderDetail["Hiển thị chi tiết đơn hàng, sản phẩm & trạng thái"] --> End

    %% Gộp luồng tìm kiếm sản phẩm (Merge Node)
    CheckOrderCode -- "Không (Tìm SP)" --> ParseQuery["Phân tích câu thành hard_filters & soft_tokens"]
    ParseQuery --> MergeNode(("Merge"))
    EncodeImg --> MergeNode

    MergeNode --> BuildRep["Xây dựng đối tượng QueryRepresentation"]
    BuildRep --> FilterDB["Lọc sản phẩm theo hard_filters (Danh mục, Màu, Giá)"]

    %% Ngoại lệ 1: Nới lỏng filter nếu < 3 kết quả
    FilterDB --> CheckMin3{"Số sản phẩm < 3?"}
    CheckMin3 -- "Có (Ngoại lệ 1)" --> RelaxFilter["Chuyển filter Màu/Chất liệu thành soft_preference\n& truy vấn lại theo Danh mục + Giá"]
    RelaxFilter --> CheckAny{"Results found?\n(Có sản phẩm > 0?)"}
    CheckMin3 -- "Không (>= 3 SP)" --> CheckAny

    %% Ngoại lệ 2: Không có kết quả nào
    CheckAny -- "Không (Ngoại lệ 2)" --> SuggestKeywords["Thông báo rỗng & Gợi ý từ khóa khác"] --> End

    %% Xếp hạng (FR4)
    CheckAny -- "Có" --> SearchIndexes["Tìm trên KeywordIndex & VectorIndex trong tập allowed"]
    SearchIndexes --> RankResults["RankingService chấm điểm & sắp xếp tạo SearchResult[]"]
    RankResults --> DisplayResults["Hiển thị danh sách kết quả, điều kiện đã hiểu & thông báo nới filter (nếu có)"]

    %% Ngoại lệ 3: Lọc lại trên UI
    DisplayResults --> UserFilterUI{"Apply UI filters?\n(Ngoại lệ 3)"}
    UserFilterUI -- "Có" --> OverrideFilter["Ghi đè hard_filters bằng lựa chọn trên UI"] --> FilterDB
    UserFilterUI -- "Không" --> ClickProduct["Customer nhấn xem chi tiết 1 sản phẩm (FR5)"]

    %% Ngoại lệ 4: Kiểm tra tồn kho
    ClickProduct --> CheckStock{"In stock?\n(stock > 0 - Ngoại lệ 4)"}
    CheckStock -- "Không (Hết hàng)" --> ShowOutStock["Hiển thị nhãn 'Hết hàng' & ẩn nút Thêm vào giỏ"] --> End
    CheckStock -- "Có (Còn hàng)" --> AddToCart["Hiển thị nút 'Thêm vào túi' & cho phép mua hàng"] --> End
```

### 2.2. Activity Diagram 2 — Luồng AI Stylist Phối đồ & Thử đồ trực tiếp Wearson AI (`FR13`, `FR14`)

```mermaid
flowchart TD
    StartStylist([Bắt đầu]) --> OpenStudio["Customer mở trang AI Stylist & Phối đồ"]
    OpenStudio --> CaptureBody["Chụp ảnh trực tiếp qua Camera hoặc tải ảnh toàn thân"]
    CaptureBody --> AnalyzeBody["Phân tích vóc dáng (Body Shape) & tông da từ ảnh"]
    AnalyzeBody --> InputDecision{"Chọn cách nhập mong muốn?"}

    %% Nhánh 1: 3-4 câu hỏi mẫu
    InputDecision -- "Hướng 1: Trắc nghiệm có mẫu" --> AnswerQuiz["Trả lời 4 câu hỏi mẫu:\n1. Dịp mặc  2. Phong cách\n3. Ưu tiên dáng  4. Ngân sách & Màu"]
    AnswerQuiz --> MergePref(("Merge"))

    %% Nhánh 2: Bật Mic nói (Mumble Voice)
    InputDecision -- "Hướng 2: Bật Mic nói" --> RecordVoice["Bật Mic / Giữ Ctrl+Space nói mong muốn tiếng Việt"]
    RecordVoice --> SpeechToText["Chuyển giọng nói thành văn bản (Transcript)"]
    SpeechToText --> ParseVoicePref["Tách các tiêu chí (Dịp, Phong cách, Dáng, Ngân sách)"]
    ParseVoicePref --> MergePref

    %% Hội tụ & Phối nhiều bộ Costume
    MergePref --> BuildStylistReq["Tạo hồ sơ yêu cầu phối đồ (StylistSession)"]
    BuildStylistReq --> MixOutfits["CostumeMixerService chọn sản phẩm còn hàng trong shop\nphối thành 3 bộ Costume (Áo + Quần/Váy + Khoác/Phụ kiện)"]
    MixOutfits --> RankOutfits["Chấm điểm độ hợp dáng & tạo lời giải thích cho từng bộ"]
    RankOutfits --> ShowCostumes["Hiển thị 3 bộ Costume hoàn chỉnh trên giao diện"]

    ShowCostumes --> TryOnChoice{"Chọn thử đồ trực tiếp?"}
    TryOnChoice -- "Có (FR14: Wearson AI)" --> RunWearson["Đẩy ảnh khách hàng + Bộ Costume sang WearsonTryOnService"]
    RunWearson --> DisplayPreview["Hiển thị hình ảnh khách hàng đang mặc bộ Costume đó"]
    DisplayPreview --> BuyChoice{"Thêm cả bộ vào giỏ?"}
    TryOnChoice -- "Không" --> BuyChoice

    BuyChoice -- "Có" --> BatchAddCart["Thêm toàn bộ sản phẩm của bộ Costume vào Giỏ hàng"] --> EndStylist([Kết thúc])
    BuyChoice -- "Đổi bộ khác" --> ShowCostumes
```

---

## 3. Trích xuất Lớp Thực thể (5 Bước chuẩn `tt_nhichu.pdf` trang 18–20)

### Bước 1: Mô tả nghiệp vụ trong một đoạn văn ngắn
> **Khách hàng** tìm **sản phẩm** bằng cách gõ chữ, nói hoặc tải **ảnh** lên, hoặc chụp **ảnh cá nhân** kèm câu trả lời/lời nói để hệ thống gợi ý các **bộ trang phục (Costume)** và **mặc thử trực tiếp**. Khi tìm kiếm, **hệ thống** giữ các sản phẩm đúng **danh mục**, **màu sắc** và **mức giá** khách nêu (nếu dưới 3 kết quả thì nới lỏng màu sắc), rồi trả về **danh sách kết quả** gồm các **kết quả** mang **thứ hạng** và **nhãn giải thích**. Mỗi sản phẩm thuộc một **danh mục** (danh mục có thể nằm trong **danh mục lớn hơn**), có **tên**, **giá**, **mô tả**, **lượt bán**, **điểm đánh giá** và các **biến thể** theo **màu**, **kích cỡ**, **tồn kho**. Mỗi **lượt tìm kiếm** và mỗi **phiên tư vấn phối đồ** được lưu lại. Khách hàng có thể thêm sản phẩm hoặc cả **bộ trang phục** vào **giỏ hàng**, tiến hành đặt **đơn hàng** gồm các **dòng đơn hàng** và tra cứu **trạng thái đơn hàng**.

### Bước 2 & Bước 3: Phân loại danh từ vào 3 nhóm (Entity Class / Attribute / Loại bỏ)

| Nhóm 1: Entity Class (Lớp thực thể) | Nhóm 2: Attribute (Thuộc tính của lớp) | Nhóm 3: Loại bỏ (Lý do) |
|---|---|---|
| • Khách hàng & Quản trị viên $\rightarrow$ **`User`** (`Customer` / `Admin`)<br>• Danh mục $\rightarrow$ **`Category`**<br>• Sản phẩm $\rightarrow$ **`Product`**<br>• Biến thể sản phẩm $\rightarrow$ **`ProductVariant`**<br>• Lượt tìm kiếm $\rightarrow$ **`QueryRepresentation`**<br>• Kết quả tìm kiếm $\rightarrow$ **`SearchResult`**<br>• Phiên tư vấn phối đồ $\rightarrow$ **`StylistSession`**<br>• Bộ trang phục $\rightarrow$ **`Outfit` (Costume)**<br>• Món đồ trong bộ $\rightarrow$ **`OutfitItem`**<br>• Phiên thử đồ ảo $\rightarrow$ **`TryOnSession`**<br>• Đơn hàng $\rightarrow$ **`Order`**<br>• Dòng đơn hàng $\rightarrow$ **`OrderItem`** | • Cách nhập $\rightarrow$ `modality` của `QueryRepresentation`<br>• Danh mục, màu, giá khách nêu $\rightarrow$ `hardFilters`, `softTokens` của `QueryRepresentation`<br>• Ảnh tìm kiếm $\rightarrow$ `imageEmbedding` của `QueryRepresentation`<br>• Thứ hạng, điểm, nhãn giải thích $\rightarrow$ `rank`, `score`, `badges` của `SearchResult`<br>• Ảnh cá nhân, dáng người, câu trả lời/lời nói $\rightarrow$ `userPhotoUrl`, `bodyShape`, `preferences` của `StylistSession`<br>• Tên, giá gốc, mô tả, lượt bán, đánh giá $\rightarrow$ `name`, `basePrice`, `description`, `soldCount`, `rating` của `Product`<br>• Màu, kích cỡ, tồn kho $\rightarrow$ `colorName`, `size`, `stockQuantity` của `ProductVariant`<br>• Trạng thái đơn, tổng tiền $\rightarrow$ `orderStatus`, `totalAmount` của `Order` | • **Hệ thống:** quá chung, là toàn bộ phần mềm.<br>• **Danh sách kết quả:** chỉ là tập hợp (`List`) các đối tượng `SearchResult`.<br>• **Danh mục lớn hơn:** không phải lớp riêng, mà là quan hệ tự liên kết cha–con (`parent`) của chính lớp `Category`. |

### Bước 4: Xác định quan hệ số lượng (`1-1`, `1-n`, `n-n`)
- **Quan hệ `1-n`:**
  - `User (1) ── (0..*) QueryRepresentation`
  - `User (1) ── (0..*) StylistSession`
  - `User (1) ── (0..*) Order`
  - `Category cha (0..1) ── (0..*) Category con` (tự tham chiếu)
  - `Category (1) ── (0..*) Product`
  - `Product (1) ── (1..*) ProductVariant`
- **Quan hệ `n-n` (Tách bằng lớp thực thể trung gian):**
  - `QueryRepresentation` và `Product` có quan hệ `n-n` $\rightarrow$ Tách bằng lớp **`SearchResult`** (mang thuộc tính `rank`, `score`, `badges`).
  - `Outfit` (Bộ Costume) và `Product` có quan hệ `n-n` $\rightarrow$ Tách bằng lớp **`OutfitItem`** (mang thuộc tính `slotRole` như Áo/Quần/Khoác).
  - `Order` và `ProductVariant` có quan hệ `n-n` $\rightarrow$ Tách bằng lớp **`OrderItem`** (mang thuộc tính `quantity`, `unitPrice`).

### Bước 5: Xác định bản chất quan hệ đối tượng (Composition vs Association)
- **Composition (`◆──`):**
  - `QueryRepresentation (1) ◆── (0..*) SearchResult`: Thứ hạng `rank` chỉ có ý nghĩa trong đúng lượt tìm kiếm đó.
  - `Product (1) ◆── (1..*) ProductVariant`: Biến thể màu/size thuộc sở hữu của sản phẩm.
  - `Outfit (1) ◆── (2..*) OutfitItem`: Các thành phần phối đồ gắn chặt với bộ Costume.
  - `Order (1) ◆── (1..*) OrderItem`: Dòng đơn hàng không tồn tại độc lập ngoài đơn hàng.
- **Association (`───`):**
  - `SearchResult (0..*) ─── (1) Product`
  - `OutfitItem (0..*) ─── (1) Product`
  - `StylistSession (1) ─── (1..*) Outfit`
  - `Product (0..*) ─── (1) Category`

---

## 4. Biểu đồ Lớp Phân tích (Analysis Class Diagram)

### 4.1. Sơ đồ Entity Classes ở mức Phân tích (Chỉ mang ý nghĩa nghiệp vụ)

```mermaid
classDiagram
    direction LR

    class User {
        fullName
        email
        role
    }

    class Category {
        name
        slug
        description
    }

    class Product {
        name
        basePrice
        description
        soldCount
        rating
    }

    class ProductVariant {
        sku
        colorName
        size
        price
        stockQuantity
    }

    class QueryRepresentation {
        rawText
        modality
        hardFilters
        softTokens
        relaxedFilters
        createdAt
    }

    class SearchResult {
        rank
        score
        badges
    }

    class StylistSession {
        userPhotoUrl
        inputMode
        bodyShape
        occasion
        styleVibe
        budgetLimit
        voiceTranscript
    }

    class Outfit {
        title
        styleTag
        occasion
        stylistNote
        totalPrice
    }

    class OutfitItem {
        slotRole
        isMainItem
    }

    class TryOnSession {
        userImageUrl
        resultImageUrl
        status
    }

    class Order {
        orderCode
        totalAmount
        shippingFee
        orderStatus
        paymentStatus
        shippingAddress
        createdAt
    }

    class OrderItem {
        quantity
        unitPrice
    }

    Category "0..1" --> "0..*" Category : parent
    Category "1" --> "0..*" Product : categorizes
    Product "1" *-- "1..*" ProductVariant : has

    User "1" --> "0..*" QueryRepresentation : performs
    QueryRepresentation "1" *-- "0..*" SearchResult : contains
    SearchResult "0..*" --> "1" Product : refers to

    User "1" --> "0..*" StylistSession : requests
    StylistSession "1" --> "1..*" Outfit : recommends
    Outfit "1" *-- "2..*" OutfitItem : composed of
    OutfitItem "0..*" --> "1" Product : picks
    StylistSession "1" --> "0..*" TryOnSession : previews in
    TryOnSession "0..*" --> "0..1" Outfit : wears

    User "1" --> "0..*" Order : places
    Order "1" *-- "1..*" OrderItem : includes
    OrderItem "0..*" --> "1" ProductVariant : locks
```

### 4.2. Bảng View Classes (`in` / `out` / `sub`) và Control Classes (Chuẩn trang 22 `tt_nhichu.pdf`)

Quy ước ký hiệu phần tử giao diện của PTIT:
- **`in...`**: Phần tử nhận dữ liệu đầu vào từ Actor (ô text, micro, file ảnh, nút radio câu hỏi).
- **`out...`**: Phần tử hiển thị kết quả ra màn hình.
- **`sub...`**: Nút bấm hoặc đường link kích hoạt sự kiện gửi yêu cầu (`actionPerformed`).

| View Class (Lớp giao diện) | Các phần tử thành phần (`in` / `out` / `sub`) |
|---|---|
| **`SearchUI`** | • `inQuery`: Ô nhập từ khóa hoặc mã đơn hàng<br>• `subSearch`: Nút bấm Tìm kiếm |
| **`VoiceInput`** | • `inVoice`: Lời nói tiếng Việt thu từ micro / Mumble Voice (`Ctrl+Space`)<br>• `outTranscript`: Văn bản phiên âm hiển thị trực tiếp<br>• `subMic`: Nút bật/tắt thu âm |
| **`ImageUpload`** | • `inImage`: File ảnh trang phục tải lên<br>• `inSelectedBox`: Vùng trang phục được chọn trên ảnh (`BoundingBox`)<br>• `subUpload`: Nút tải ảnh & xác nhận vùng chọn |
| **`SearchResultView`** | • `outFilters`: Các điều kiện hệ thống đã hiểu (Danh mục, Màu, Giá)<br>• `outRelaxedNotice`: Thông báo khi bộ lọc được nới lỏng (do `< 3` kết quả)<br>• `outResults`: Danh sách sản phẩm kèm thứ hạng & nhãn giải thích<br>• `subFilter`: Bộ lọc giao diện (Size, Giá, Sắp xếp)<br>• `subProduct`: Link nhấn vào xem chi tiết sản phẩm |
| **`StylistStudioUI`** | • `inBodyPhoto`: Ảnh chụp trực tiếp từ Webcam hoặc ảnh toàn thân tải lên<br>• `inQuizAnswers`: Các phương án trả lời cho 4 câu hỏi mẫu (Dịp, Phong cách, Dáng, Ngân sách)<br>• `inVoicePrompt`: Lời nói mô tả mong muốn qua Mumble Voice<br>• `outBodyAnalysis`: Kết quả phân tích dáng người & tông da<br>• `outCostumes`: Danh sách 2–3 bộ Costume được phối kèm lời khuyên của AI Stylist<br>• `subGenerateCostumes`: Nút bấm Phân tích & Phối đồ<br>• `subTryOnCostume`: Nút bấm Ướm thử bộ đồ với Wearson AI<br>• `subAddCostume`: Nút thêm nguyên bộ Costume vào giỏ hàng |
| **`TryOnPreviewView`** | • `outPreviewImage`: Hình ảnh người dùng đang mặc bộ Costume do Wearson AI tạo ra<br>• `subCompare`: Nút chuyển đổi xem ảnh gốc / ảnh mặc thử |
| **`OrderLookupView`** | • `outOrderInfo`: Thông tin mã đơn, trạng thái, ngày đặt, tổng tiền<br>• `outOrderItems`: Danh sách các sản phẩm trong đơn hàng |
| **`AdminDashboardUI`** | • `inProductForm`, `inCategoryForm`, `inOrderStatus`: Các ô nhập liệu quản trị<br>• `outMetrics`, `outInventoryTable`, `outOrderList`: Bảng dữ liệu quản trị<br>• `subSaveProduct`, `subSaveCategory`, `subUpdateOrder`: Các nút lưu thay đổi |

### 4.3. Bảng 4 Câu hỏi Gán Trách nhiệm Hàm (Method Assignment Table — Trang 22 `tt_nhichu.pdf`)

| Câu hỏi | Chức năng 1: Tìm sản phẩm (`FR1–FR4`) | Chức năng 2: Tư vấn & Phối Costume (`FR13`) | Chức năng 3: Thử đồ Wearson AI (`FR14`) | Chức năng 4: Xem chi tiết SP (`FR5`) | Chức năng 5: Tra cứu đơn hàng (`FR6–FR7`) |
|---|---|---|---|---|---|
| **1. Tên method?** | `search` | `recommendCostumes` | `tryOnCostume` | `get` | `findByCode` |
| **2. Input?** | Nội dung chữ/giọng nói, file ảnh, vùng chọn, `modality` | Ảnh cơ thể, câu trả lời 4 câu hỏi mẫu hoặc câu nói từ mic | Ảnh cơ thể khách, mã bộ `Outfit` (hoặc `variantId`) | Mã sản phẩm (`productId`) | Mã đơn hàng (`orderCode`) |
| **3. Output?** | Danh sách `SearchResult[]` & trạng thái nới filter | Hồ sơ dáng người & Danh sách `Outfit[]` (2–3 bộ Costume) | Đối tượng `TryOnSession` chứa `resultImageUrl` | Đối tượng `Product` | Đối tượng `Order` |
| **4. Class chứa?** | Việc tìm kiếm phối hợp nhiều bước nên đặt tại lớp điều phối **`SearchOrchestrator`** (nhận yêu cầu từ `SearchController`) | Việc phân tích dáng, hiểu ý định và ghép nhiều món đồ phức tạp nên đặt tại **`StylistOrchestrator`** (nhận từ `StylistController`) | Việc ghép ảnh trang phục lên người dùng đặt tại **`WearsonTryOnService`** | Output là thực thể `Product`, đặt tại **`ProductRepository.get`** | Output là thực thể `Order`, đặt tại **`OrderRepository.findByCode`** |

---

## 5. Biểu đồ Tuần tự Phân tích (Analysis Sequence Diagrams)

### 5.1. Analysis Sequence Diagram 1 — Tìm kiếm sản phẩm (Text / Voice / Image)

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant UI as SearchUI / VoiceInput / ImageUpload
    participant Ctrl as SearchController
    participant Orch as SearchOrchestrator
    participant STT as SpeechService
    participant QrySvc as QueryService
    participant Parser as QueryParser / ImageEncoder
    participant SrchSvc as SearchService
    participant Repo as ProductRepository
    participant RankSvc as RankingService
    participant ResView as SearchResultView

    Customer->>UI: 1. Nhập câu / Nói qua Mic / Tải ảnh & nhấn Tìm
    UI->>Ctrl: 2. Gửi yêu cầu tìm kiếm
    Ctrl->>Orch: 3. Chuyển yêu cầu cho SearchOrchestrator điều phối

    opt Nếu способа nhập là Giọng nói (Voice)
        Orch->>STT: 3a. Chuyển giọng nói thành văn bản tiếng Việt
        STT-->>Orch: 3b. Trả về transcript văn bản
    end

    Orch->>QrySvc: 4. Yêu cầu xây dựng cấu trúc truy vấn
    QrySvc->>Parser: 5. Phân tích câu (hoặc mã hóa vùng ảnh)
    Parser-->>QrySvc: 6. Tạo QueryRepresentation (gồm hardFilters, softTokens, vector)
    QrySvc-->>Orch: 7. Trả về QueryRepresentation

    Orch->>SrchSvc: 8. Yêu cầu lấy các sản phẩm ứng viên phù hợp
    SrchSvc->>Repo: 9. Lọc danh sách sản phẩm thỏa hardFilters
    Repo-->>SrchSvc: 10. Trả về tập sản phẩm hợp lệ (nếu < 3 SP thì tự nới lỏng filter màu)
    SrchSvc->>SrchSvc: 11. Tìm theo từ khóa & nội dung vector trong tập hợp lệ, gộp danh sách
    SrchSvc-->>Orch: 12. Trả về danh sách ứng viên (RetrievalResult)

    Orch->>RankSvc: 13. Chấm điểm, sắp xếp & sinh nhãn giải thích
    RankSvc-->>Orch: 14. Trả về danh sách SearchResult[]
    Orch-->>Ctrl: 15. Trả kết quả tìm kiếm
    Ctrl-->>ResView: 16. Hiển thị điều kiện đã hiểu, thông báo nới filter (nếu có) & danh sách sản phẩm
```

### 5.2. Analysis Sequence Diagram 2 — AI Stylist Phối nhiều Costume & Thử đồ Wearson AI

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant StudioUI as StylistStudioUI
    participant Ctrl as StylistController
    participant Orch as StylistOrchestrator
    participant BodySvc as BodyAnalysisService
    participant IntentSvc as StylingIntentService
    participant Mixer as CostumeMixerService
    participant Repo as ProductRepository
    participant Wearson as WearsonTryOnService
    participant PreviewUI as TryOnPreviewView

    Customer->>StudioUI: 1. Chụp ảnh trực tiếp (hoặc tải ảnh) & trả lời 4 câu hỏi mẫu (hoặc bật Mic nói)
    StudioUI->>Ctrl: 2. Gửi ảnh cơ thể + dữ liệu mong muốn (Quiz hoặc Voice)
    Ctrl->>Orch: 3. Gọi StylistOrchestrator xử lý tư vấn

    Orch->>BodySvc: 4. Phân tích tỷ lệ vóc dáng & sắc độ da từ ảnh
    BodySvc-->>Orch: 5. Trả về đặc điểm hình thể (bodyShape, recommendedFit)

    Orch->>IntentSvc: 6. Chuẩn hóa câu trả lời hoặc bóc tách lời nói từ Mumble Voice
    IntentSvc-->>Orch: 7. Trả về tiêu chí phối đồ (occasion, styleVibe, fitPreference, budget)

    Orch->>Mixer: 8. Yêu cầu phối các bộ Costume phù hợp
    Mixer->>Repo: 9. Lấy các sản phẩm đang còn hàng theo danh mục (Áo, Quần/Váy, Khoác, Phụ kiện)
    Repo-->>Mixer: 10. Trả về danh sách sản phẩm theo nhóm
    Mixer->>Mixer: 11. Phối 3 bộ Costume hài hòa màu sắc, đúng ngân sách & tôn dáng người dùng
    Mixer-->>Orch: 12. Trả về danh sách Outfit[] kèm lời khuyên của Stylist AI
    Orch-->>Ctrl: 13. Trả về kết quả tư vấn StylistSession
    Ctrl-->>StudioUI: 14. Hiển thị 3 bộ Costume hoàn chỉnh trên màn hình

    Customer->>StudioUI: 15. Bấm "Ướm thử trực tiếp với Wearson AI" tại bộ Costume yêu thích
    StudioUI->>Ctrl: 16. Gửi yêu cầu thử đồ (userPhotoUrl, selectedOutfit)
    Ctrl->>Wearson: 17. Ghép các món đồ trong bộ Costume lên ảnh thật của khách hàng
    Wearson-->>Ctrl: 18. Trả về TryOnSession (chứa ảnh kết quả mặc thử)
    Ctrl-->>PreviewUI: 19. Hiển thị hình ảnh khách hàng đang mặc bộ Costume trực quan
```

---

# PHẦN III: THIẾT KẾ HỆ THỐNG (SYSTEM DESIGN)

## 1. Kiến trúc 3 Layer & Package Diagram (Chuẩn trang 25–30 `tt_nhichu.pdf`)

### 1.1. Ba Layer và Trách nhiệm
Hệ thống tuân thủ nghiêm ngặt kiến trúc 3 tầng, **dependency chỉ đi một chiều từ trên xuống**, tầng `Presentation` tuyệt đối không gọi tắt xuống tầng `Data`:
1. **Presentation Layer:** Tiếp nhận thao tác của `Customer` và `Admin`, hiển thị kết quả (`SearchUI`, `VoiceInput`, `ImageUpload`, `SearchResultView`, `StylistStudioUI`, `TryOnPreviewView`, `OrderLookupView`, `AdminDashboardUI`, `SearchController`, `StylistController`, `AdminController`).
2. **Application Layer:** Điều phối luồng nghiệp vụ, phân tích câu truy vấn, nhận diện dáng người, phối các bộ Costume, sắp xếp thứ hạng và gọi ghép ảnh thử đồ (`SearchOrchestrator`, `StylistOrchestrator`, `SpeechService`, `QueryService`, `ImageService`, `SearchService`, `RankingService`, `BodyAnalysisService`, `CostumeMixerService`, `WearsonTryOnService`).
3. **Data Layer:** Lưu trữ và truy cập cơ sở dữ liệu, chỉ mục từ khóa, chỉ mục vector và kho ảnh (`ProductRepository`, `OrderRepository`, `StylistRepository`, `VectorIndex`, `KeywordIndex`, `ImageStorage`).

### 1.2. Package Diagram (4 Packages chuẩn PTIT)

```mermaid
flowchart TB
    subgraph pkg_interface ["📦 package: interface (View Classes)"]
        V1["SearchUI"]
        V2["VoiceInput"]
        V3["ImageUpload"]
        V4["SearchResultView"]
        V5["StylistStudioUI"]
        V6["TryOnPreviewView"]
        V7["OrderLookupView"]
        V8["AdminDashboardUI"]
    end

    subgraph pkg_controller ["📦 package: controller (Controllers, Orchestrators, Services & Interfaces)"]
        C1["SearchController"]
        C2["SearchOrchestrator"]
        C3["StylistController"]
        C4["StylistOrchestrator"]
        C5["AdminController"]
        S1["QueryService · SearchService · RankingService"]
        S2["BodyAnalysisService · CostumeMixerService · WearsonTryOnService"]
        I1["«interface» QueryParser · ImageEncoder · SpeechToText · TryOnEngine"]
    end

    subgraph pkg_dao ["📦 package: DAO (Data Access & Indexes)"]
        D1["productDAO (ProductRepository)"]
        D2["indexDAO (VectorIndex, KeywordIndex)"]
        D3["orderDAO (OrderRepository)"]
        D4["stylistDAO (StylistRepository)"]
    end

    subgraph pkg_model ["📦 package: model (Domain Entity Classes)"]
        M1["product (Product, ProductVariant, Category)"]
        M2["search (QueryRepresentation, SearchResult)"]
        M3["stylist (StylistSession, Outfit, OutfitItem, TryOnSession)"]
        M4["order (Order, OrderItem, User)"]
    end

    pkg_interface -. "«use»" .-> pkg_controller
    pkg_controller -. "«use»" .-> pkg_dao
    pkg_controller -. "«use»" .-> pkg_model
    pkg_dao -. "«use»" .-> pkg_model
```

---

## 2. Thiết kế Entity Class (4 Bước chuẩn trang 31 `tt_nhichu.pdf`)

1. **Bước 1 — Thêm khóa định danh (`id`):**
   - `Product` có `productId : String`, `ProductVariant` có `variantId : String`, `Category` dùng `slug : String` (hoặc `categoryId : String`) làm khóa.
   - `QueryRepresentation`, `SearchResult`, `StylistSession`, `Outfit`, `OutfitItem`, `TryOnSession`, `Order`, `OrderItem` đều có `id : String` khi lưu xuống CSDL.
2. **Bước 2 — Thêm kiểu dữ liệu cho mọi Attribute:**
   - `basePrice : float`, `stockQuantity : int`, `imageEmbedding : float[]`, `textEmbedding : float[]`, `modality : Modality`, `hardFilters : Map<String, Object>`, `rank : int`, `score : float`, `badges : String[]`.
3. **Bước 3 — Chuyển Association thành Composition khi cần:**
   - `QueryRepresentation ◆── SearchResult`, `Outfit ◆── OutfitItem`, `Product ◆── ProductVariant`, `Order ◆── OrderItem`.
   - `Product ─── Category` giữ nguyên là Association vì `Category` tồn tại độc lập.
4. **Bước 4 — Thêm Attribute kiểu Object để giữ tham chiếu đối tượng liên quan:**
   - `SearchResult` có thuộc tính `product : Product`.
   - `Outfit` có thuộc tính `items : OutfitItem[]`.
   - `OutfitItem` có thuộc tính `product : Product` và `variant : ProductVariant`.
   - `StylistSession` có thuộc tính `recommendedOutfits : Outfit[]`.

---

## 3. Thiết kế Cơ sở Dữ liệu (5 Bước) & Biểu đồ ERD (Chuẩn trang 32–33 `tt_nhichu.pdf`)

### 3.1. Năm bước chuyển từ Entity Class sang Database Tables
1. **Bước 1 (Mỗi Entity Class thành một Table):** `users`, `categories`, `products`, `product_variants`, `query_representations`, `search_results`, `stylist_sessions`, `outfits`, `outfit_items`, `tryon_sessions`, `orders`, `order_items`.
2. **Bước 2 (Attribute nguyên thủy thành Cột):** Ví dụ bảng `products` có các cột `name`, `base_price`, `description`, `sold_count`, `rating`, `image_url`, `text_embedding`, `image_embedding`.
3. **Bước 3 (Biểu diễn quan hệ):**
   - `Category – Product` là `1-n` $\rightarrow$ Giữ 2 bảng.
   - `QueryRepresentation – Product` là `n-n` $\rightarrow$ Có bảng trung gian `search_results`.
   - `Outfit – Product` là `n-n` $\rightarrow$ Có bảng trung gian `outfit_items`.
4. **Bước 4 (Khóa chính & Khóa ngoại):** `id` thành `PRIMARY KEY`. Phía `n` giữ `FOREIGN KEY`: `category_id` trong `products`, `parent_id` trong `categories` (tự tham chiếu cha-con), `query_id` và `product_id` trong `search_results`, `outfit_id` và `product_id` trong `outfit_items`.
5. **Bước 5 (Loại bỏ dữ liệu dư thừa):** Bảng `search_results` không chép lại tên hay giá sản phẩm mà chỉ giữ `product_id`, `rank`, `score` và `badges`.

### 3.2. Sơ đồ ERD Hoàn chỉnh

```mermaid
erDiagram
    CATEGORIES ||--o{ CATEGORIES : "parent_id (Cha - Con)"
    CATEGORIES ||--o{ PRODUCTS : "category_id"
    PRODUCTS ||--|{ PRODUCT_VARIANTS : "product_id"

    USERS ||--o{ QUERY_REPRESENTATIONS : "user_id"
    QUERY_REPRESENTATIONS ||--o{ SEARCH_RESULTS : "query_id"
    PRODUCTS ||--o{ SEARCH_RESULTS : "product_id"

    USERS ||--o{ STYLIST_SESSIONS : "user_id"
    STYLIST_SESSIONS ||--|{ OUTFITS : "stylist_session_id"
    OUTFITS ||--|{ OUTFIT_ITEMS : "outfit_id"
    PRODUCTS ||--o{ OUTFIT_ITEMS : "product_id"
    PRODUCT_VARIANTS ||--o{ OUTFIT_ITEMS : "variant_id"

    STYLIST_SESSIONS ||--o{ TRYON_SESSIONS : "stylist_session_id"
    OUTFITS ||--o{ TRYON_SESSIONS : "outfit_id"
    PRODUCT_VARIANTS ||--o{ TRYON_SESSIONS : "variant_id"

    USERS ||--o{ ORDERS : "user_id"
    ORDERS ||--|{ ORDER_ITEMS : "order_id"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "variant_id"

    CATEGORIES {
        varchar category_id PK
        varchar parent_id FK
        varchar slug UK
        varchar name
        text description
    }
    PRODUCTS {
        varchar product_id PK
        varchar category_id FK
        varchar name
        numeric base_price
        text description
        int sold_count
        float rating
        text image_url
        text image_alt_url
        vector text_embedding
        vector image_embedding
    }
    PRODUCT_VARIANTS {
        varchar variant_id PK
        varchar product_id FK
        varchar sku UK
        varchar color_code
        varchar color_name
        varchar size
        numeric price
        int stock_quantity
    }
    QUERY_REPRESENTATIONS {
        varchar query_id PK
        varchar user_id FK
        varchar modality
        text raw_text
        jsonb hard_filters
        jsonb soft_tokens
        jsonb relaxed_filters
        timestamptz created_at
    }
    SEARCH_RESULTS {
        varchar result_id PK
        varchar query_id FK
        varchar product_id FK
        int rank
        float score
        jsonb badges
    }
    STYLIST_SESSIONS {
        varchar stylist_session_id PK
        varchar user_id FK
        text user_photo_url
        varchar input_mode
        varchar body_shape
        jsonb preferences
        text voice_transcript
        timestamptz created_at
    }
    OUTFITS {
        varchar outfit_id PK
        varchar stylist_session_id FK
        varchar title
        varchar style_tag
        varchar occasion
        text stylist_note
        numeric total_price
    }
    OUTFIT_ITEMS {
        varchar outfit_item_id PK
        varchar outfit_id FK
        varchar product_id FK
        varchar variant_id FK
        varchar slot_role
        boolean is_main_item
    }
    TRYON_SESSIONS {
        varchar session_id PK
        varchar stylist_session_id FK
        text user_image_url
        varchar outfit_id FK
        varchar variant_id FK
        text result_image_url
        varchar status
        timestamptz created_at
    }
    ORDERS {
        varchar order_id PK
        varchar order_code UK
        varchar user_id FK
        numeric total_amount
        numeric shipping_fee
        varchar order_status
        varchar payment_status
        jsonb shipping_address
        timestamptz created_at
    }
    ORDER_ITEMS {
        varchar order_item_id PK
        varchar order_id FK
        varchar variant_id FK
        int quantity
        numeric unit_price
    }
```

---

## 4. Biểu đồ Lớp Thiết kế (Design Class Diagrams — Chuẩn trang 34–36 `tt_nhichu.pdf`)

### 4.1. Design Class Diagram 1 — Package `interface` và `controller`
`SearchController` chỉ gọi một hàm điều phối `SearchOrchestrator.search()`, và `StylistController` gọi `StylistOrchestrator.recommendCostumes()`:

```mermaid
classDiagram
    direction TB

    class SearchUI {
        +String inQuery
        +actionPerformed() void
    }
    class VoiceInput {
        +Blob inVoice
        +String outTranscript
        +actionPerformed() void
    }
    class ImageUpload {
        +File inImage
        +BoundingBox inSelectedBox
        +actionPerformed() void
    }
    class StylistStudioUI {
        +String inBodyPhoto
        +Map inQuizAnswers
        +String inVoicePrompt
        +Outfit[] outCostumes
        +actionPerformed() void
    }

    class SearchController {
        -SearchOrchestrator orchestrator
        -OrderRepository orderRepo
        +search(body: SearchRequest) SearchResponse
        +searchImage(image: File, box: BoundingBox, text: String) SearchResponse
        +lookupOrder(orderCode: String) Order
    }

    class SearchOrchestrator {
        -SpeechToText speechService
        -QueryService queryService
        -SearchService searchService
        -RankingService rankingService
        +search(text: String, image: File, modality: Modality, box: BoundingBox) SearchResponse
    }

    class QueryService {
        -QueryParser parser
        -ImageEncoder encoder
        +build(text: String, image: File, modality: Modality, box: BoundingBox) QueryRepresentation
    }

    class SearchService {
        -ProductRepository productRepo
        -KeywordIndex keywordIndex
        -VectorIndex vectorIndex
        +retrieve(rep: QueryRepresentation) RetrievalResult
    }

    class RankingService {
        +rank(rep: QueryRepresentation, candidates: RetrievalResult) SearchResult[]
        +generateBadges(product: Product, rep: QueryRepresentation) String[]
    }

    class StylistController {
        -StylistOrchestrator stylistOrchestrator
        +recommend(request: StylistRequest) StylistSession
        +tryOn(userPhoto: String, outfitId: String) TryOnSession
    }

    class StylistOrchestrator {
        -BodyAnalysisService bodyService
        -SpeechToText speechService
        -QueryParser intentParser
        -CostumeMixerService mixerService
        -WearsonTryOnService tryOnService
        +recommendCostumes(photoUrl: String, quizAnswers: Map, voiceText: String, mode: String) StylistSession
        +tryOnCostume(photoUrl: String, outfit: Outfit) TryOnSession
    }

    class CostumeMixerService {
        -ProductRepository productRepo
        +mixCostumes(bodyShape: String, preferences: Map) Outfit[]
    }

    SearchUI --> SearchController
    VoiceInput --> SearchController
    ImageUpload --> SearchController
    StylistStudioUI --> StylistController

    SearchController --> SearchOrchestrator
    SearchOrchestrator --> QueryService
    SearchOrchestrator --> SearchService
    SearchOrchestrator --> RankingService

    StylistController --> StylistOrchestrator
    StylistOrchestrator --> CostumeMixerService
```

### 4.2. Design Class Diagram 2 — Package `DAO`, `model` & Realization (`Interface` $\triangleleft$.. `Implementation`)
Các thành phần dễ thay đổi (AI Parser, Image Encoder, Speech-to-Text, Try-On Engine, Repository) đều được đặt sau **Interface** (theo chuẩn trang 35–36 `tt_nhichu.pdf`):

```mermaid
classDiagram
    direction TB

    class QueryParser {
        <<interface>>
        +parse(text: String) ParsedIntent
    }
    class RuleQueryParser {
        +parse(text: String) ParsedIntent
    }
    class LlmQueryParser {
        +parse(text: String) ParsedIntent
    }

    class ImageEncoder {
        <<interface>>
        +detectObjects(image: File) BoundingBox[]
        +encode(image: File, box: BoundingBox) float[]
    }
    class ColorHistogramEncoder {
        +detectObjects(image: File) BoundingBox[]
        +encode(image: File, box: BoundingBox) float[]
    }
    class ClipImageEncoder {
        +detectObjects(image: File) BoundingBox[]
        +encode(image: File, box: BoundingBox) float[]
    }

    class SpeechToText {
        <<interface>>
        +transcribe(audio: Blob, langHint: String) String
    }
    class MumbleVoiceAdapter {
        +String hotkey
        +transcribe(audio: Blob, langHint: String) String
    }
    class WebSpeechAdapter {
        +transcribe(audio: Blob, langHint: String) String
    }

    class TryOnEngine {
        <<interface>>
        +synthesize(userPhoto: String, garments: Product[]) String
    }
    class WearsonTryOnAdapter {
        +synthesize(userPhoto: String, garments: Product[]) String
    }

    class ProductRepository {
        <<interface>>
        +get(id: String) Product
        +findIds(hardFilters: Map) String[]
        +subtreeSlugs(slug: String) String[]
        +save(product: Product) Product
    }
    class JsonProductRepository {
        +get(id: String) Product
        +findIds(hardFilters: Map) String[]
        +subtreeSlugs(slug: String) String[]
        +save(product: Product) Product
    }
    class PostgresProductRepository {
        +get(id: String) Product
        +findIds(hardFilters: Map) String[]
        +subtreeSlugs(slug: String) String[]
        +save(product: Product) Product
    }

    class VectorIndex {
        +add(ids: String[], vectors: float[][]) void
        +search(vector: float[], k: int, allowedIds: String[]) Map~String,Float~
    }

    class KeywordIndex {
        +build(docs: Product[]) void
        +search(tokens: String[], k: int, allowedIds: String[]) Map~String,Float~
    }

    QueryParser <|.. RuleQueryParser
    QueryParser <|.. LlmQueryParser
    ImageEncoder <|.. ColorHistogramEncoder
    ImageEncoder <|.. ClipImageEncoder
    SpeechToText <|.. MumbleVoiceAdapter
    SpeechToText <|.. WebSpeechAdapter
    TryOnEngine <|.. WearsonTryOnAdapter
    ProductRepository <|.. JsonProductRepository
    ProductRepository <|.. PostgresProductRepository
```

---

## 5. Biểu đồ Tuần tự Thiết kế (Design Sequence Diagrams — Chuẩn trang 37–39 `tt_nhichu.pdf`)

### 5.1. Design Sequence Diagram 1 — Luồng Tìm kiếm Đa phương thức (Build Query $\rightarrow$ Retrieve với `allowed` & Nới lỏng filter $\rightarrow$ Rank)

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant UI as SearchUI / VoiceInput / ImageUpload
    participant Ctrl as SearchController
    participant Orch as SearchOrchestrator
    participant STT as SpeechToText
    participant QrySvc as QueryService
    participant Parser as QueryParser / ImageEncoder
    participant SrchSvc as SearchService
    participant Repo as ProductRepository
    participant KwIdx as KeywordIndex
    participant VecIdx as VectorIndex
    participant RankSvc as RankingService
    participant View as SearchResultView

    Customer->>UI: 1. actionPerformed()
    UI->>Ctrl: 2. search(body) / searchImage(image, box, text)
    Ctrl->>Orch: 3. search(text, image, modality, box)

    opt Nếu modality == VOICE
        Orch->>STT: 3a. transcribe(audio, "vi")
        STT-->>Orch: 3b. transcript: String
    end

    Orch->>QrySvc: 4. build(text, image, modality, box)
    alt modality == TEXT hoặc VOICE
        QrySvc->>Parser: 5a. parse(text)
        Parser-->>QrySvc: 6a. QueryRepresentation (hardFilters, softTokens, textVector)
    else modality == IMAGE
        QrySvc->>Parser: 5b. encode(image, box)
        Parser-->>QrySvc: 6b. QueryRepresentation (imageVector, detectedCategory)
    end
    QrySvc-->>Orch: 7. rep: QueryRepresentation

    Orch->>SrchSvc: 8. retrieve(rep)
    SrchSvc->>Repo: 9. findIds(rep.hardFilters)
    Repo-->>SrchSvc: 10. allowedIds: String[]

    opt Ngoại lệ 1: Nếu allowedIds.length < 3 và có filter màu
        SrchSvc->>SrchSvc: 10a. Chuyển color từ hardFilters sang softTokens & bật cờ isRelaxed = true
        SrchSvc->>Repo: 10b. findIds(relaxedHardFilters)
        Repo-->>SrchSvc: 10c. allowedIds: String[] (đã nới lỏng)
    end

    SrchSvc->>KwIdx: 11. search(rep.softTokens, k, allowedIds)
    KwIdx-->>SrchSvc: 12. keywordScores: Map<String, Float>
    SrchSvc->>VecIdx: 13. search(rep.vector, k, allowedIds)
    VecIdx-->>SrchSvc: 14. vectorScores: Map<String, Float>
    SrchSvc-->>Orch: 15. candidates: RetrievalResult

    Orch->>RankSvc: 16. rank(rep, candidates)
    RankSvc-->>Orch: 17. results: SearchResult[] (kèm rank, score, badges[])
    Orch-->>Ctrl: 18. response: SearchResponse
    Ctrl-->>View: 19. render(response)
```

### 5.2. Design Sequence Diagram 2 — Luồng AI Stylist Phối nhiều Costume & Thử đồ Wearson AI

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant StudioUI as StylistStudioUI
    participant Ctrl as StylistController
    participant Orch as StylistOrchestrator
    participant BodySvc as BodyAnalysisService
    participant STT as SpeechToText
    participant Parser as QueryParser
    participant Mixer as CostumeMixerService
    participant Repo as ProductRepository
    participant Wearson as TryOnEngine (WearsonTryOnAdapter)
    participant Preview as TryOnPreviewView

    Customer->>StudioUI: 1. Chụp ảnh cơ thể + Chọn 4 câu trả lời mẫu (hoặc Nói qua Mic) -> actionPerformed()
    StudioUI->>Ctrl: 2. recommend(StylistRequest)
    Ctrl->>Orch: 3. recommendCostumes(photoUrl, quizAnswers, voiceText, mode)

    Orch->>BodySvc: 4. analyze(photoUrl)
    BodySvc-->>Orch: 5. bodyProfile (bodyShape, undertone, recommendedFit)

    opt Nếu mode == VOICE (Mumble Voice / Mic)
        Orch->>Parser: 6. parse(voiceText)
        Parser-->>Orch: 7. extractedPreferences (occasion, styleVibe, fitPreference, budget)
    end

    Orch->>Mixer: 8. mixCostumes(bodyProfile.bodyShape, preferences)
    Mixer->>Repo: 9. findIds(filters theo danh mục Áo, Quần/Váy, Áo khoác, Phụ kiện)
    Repo-->>Mixer: 10. Trả về các sản phẩm còn hàng (stock > 0)
    Mixer->>Mixer: 11. Ghép 3 bộ Outfit (Costume) hài hòa bảng màu & đúng ngân sách
    Mixer-->>Orch: 12. outfits: Outfit[] (kèm stylistNote & matchBadges)
    Orch-->>Ctrl: 13. session: StylistSession
    Ctrl-->>StudioUI: 14. Hiển thị 3 bộ Costume trên StylistStudioUI

    Customer->>StudioUI: 15. Chọn 1 bộ Costume & nhấn "Thử đồ trực tiếp (Wearson AI)"
    StudioUI->>Ctrl: 16. tryOn(userPhotoUrl, selectedOutfit.outfitId)
    Ctrl->>Orch: 17. tryOnCostume(userPhotoUrl, selectedOutfit)
    Orch->>Wearson: 18. synthesize(userPhotoUrl, selectedOutfit.garments)
    Wearson-->>Orch: 19. resultImageUrl: String
    Orch-->>Ctrl: 20. tryOnSession: TryOnSession
    Ctrl-->>Preview: 21. Hiển thị ảnh mặc thử trực quan trên TryOnPreviewView
```

---

# PHẦN IV: MA TRẬN ÁNH XẠ THIẾT KẾ $\leftrightarrow$ CODE (TRACEABILITY MATRIX)

Khi bạn xác nhận **Khóa Draft (Lock)**, mã nguồn trong dự án sẽ được tổ chức theo đúng 4 Package trong bản thiết kế này:

| Package trong Thiết kế | Đường dẫn trong Code (`apps/web/src/`) | Các Class / Interface bên trong (Khớp 100% tên & hàm) |
|---|---|---|
| **`model`** | `src/domain/models.ts` | `User`, `Category`, `Product`, `ProductVariant`, `QueryRepresentation`, `SearchResult`, `StylistSession`, `Outfit`, `OutfitItem`, `TryOnSession`, `Order`, `OrderItem`, `BoundingBox`, `Modality`. |
| **`DAO`** | `src/dao/repositories.ts`<br>`src/dao/indexes.ts` | • `ProductRepository` (Interface) & `JsonProductRepository` (`get`, `findIds`, `subtreeSlugs`, `save`)<br>• `OrderRepository` (`findByCode`, `listAll`, `create`, `updateStatus`)<br>• `VectorIndex` (`add`, `search(vector, k, allowedIds)`)<br>• `KeywordIndex` (`build`, `search(tokens, k, allowedIds)`) |
| **`controller`** | `src/services/interfaces.ts`<br>`src/services/search-orchestrator.ts`<br>`src/services/stylist-orchestrator.ts` | • Interfaces: `QueryParser`, `ImageEncoder`, `SpeechToText`, `TryOnEngine`<br>• Implementations: `RuleQueryParser`, `ColorHistogramEncoder`, `MumbleVoiceAdapter`, `WebSpeechAdapter`, `WearsonTryOnAdapter`<br>• Services & Orchestrators: `SearchController`, `SearchOrchestrator`, `QueryService`, `SearchService`, `RankingService`, `StylistController`, `StylistOrchestrator`, `BodyAnalysisService`, `CostumeMixerService`. |
| **`interface` (View)** | `src/components/search-rail.tsx`<br>`src/components/shop-catalog.tsx`<br>`src/app/outfits/page.tsx`<br>`src/app/try-on/page.tsx`<br>`src/app/admin/page.tsx` | • `SearchUI`, `VoiceInput` (hỗ trợ Mumble Voice `Ctrl+Space` & Web Speech), `ImageUpload` (kèm chọn vùng `BoundingBox`)<br>• `SearchResultView` (hiển thị `outFilters`, `outRelaxedNotice` khi nới filter, `badges`)<br>• `OrderLookupView` (hiển thị ngay đơn hàng khi gõ mã đơn `SF-...` vào ô tìm kiếm)<br>• `StylistStudioUI` & `TryOnPreviewView` (Chụp webcam trực tiếp + 4 câu hỏi mẫu hoặc Mic Mumble Voice $\rightarrow$ Phối 3 bộ Costume $\rightarrow$ Ướm thử trực tiếp với Wearson AI)<br>• `AdminDashboardUI` (`Manage Product`, `Manage Category`, `Manage Order`). |
