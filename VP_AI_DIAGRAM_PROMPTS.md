# BỘ LỆNH PROMPT CHUẨN CHO VISUAL PARADIGM AI (VP AI DIAGRAM GENERATOR)
**Dự án:** Hệ thống Thương mại Điện tử Thời trang Thông minh MaisonAI (`SmartFashion`)  
**Thiết kế gốc đã khóa:** `SYSTEM_DESIGN_LOCKED.md` (v2.0 — Chuẩn PTIT)

> [!TIP]
> **Tại sao cấu trúc Prompt này vẽ ra hình đẹp nhất trong Visual Paradigm AI?**
> Toàn bộ 16 Prompt dưới đây đã được chuẩn hóa **100% theo mẫu cấu trúc chuẩn của bạn (`Figure 4.1`, `4.2`, `4.3`, `4.5`, `4.6`)**:
> 1. **Dòng mở đầu:** Định nghĩa rõ loại biểu đồ UML / C4 + các ràng buộc mức độ (Analysis không có ID/FK/kiểu dữ liệu; Design có `<<ORM Persistable>>`, kiểu dữ liệu `String/Integer/Real/Boolean`, phạm vi `-`/`+` và Navigable Role Names; ERD dùng ký hiệu Crow's Foot `||--o{`; C4 dùng `[Person]`, `[Software System]`, `[External System]`).
> 2. **Danh sách đánh số (`1. 2. 3.`):** Liệt kê từng Class / Table / Package / Lifeline / C4 Component kèm `Attributes`, `Operations` hoặc `Description / Technology` rõ ràng.
> 3. **Khối `Relationships and Multiplicities` / `Foreign Key Cardinalities` / `Interactions`:** Viết đúng cú pháp mũi tên chuẩn UML (`"1" *-- "0..*"`, `"1" *--> "0..* roleName"`, `<|..`, `..> : <<use>>`, `||--o{`, `--> : "Action [Protocol]"`).
> 4. **Dòng `Layout:` ở cuối:** Chỉ định rõ bố cục sắp xếp (`Left-to-right`, `Top-to-bottom layers`, `Order/Product at center...`) để VP AI tự dàn trang cân đối, không bị chồng chéo dây.

---

## BẢNG TRA CỨU NHANH 15 BIỂU ĐỒ & LOẠI BIỂU ĐỒ TRONG VISUAL PARADIGM

| Mã Hình | Tên Biểu đồ (Theo đúng thứ tự Báo cáo PTIT) | Loại Biểu đồ chọn trong VP (`Diagram Type`) |
|---|---|---|
| **Figure 0.1** | C4 System Context Diagram (Level 1) — Bối cảnh Hệ thống SmartFashion | **`C4 Diagram`** hoặc **`C4 Context Diagram`** |
| **Figure 1.1** | Use Case Tổng quát Toàn Hệ thống (`FR1`–`FR14`, 2 Actor người thực) | **`Use Case Diagram`** |
| **Figure 1.2** | Use Case Phân rã Module Tìm kiếm Đa phương thức & AI Stylist | **`Use Case Diagram`** |
| **Figure 2.1** | Activity Diagram: Tìm kiếm Đa phương thức, Tra cứu Đơn & 4 Ngoại lệ | **`Activity Diagram`** |
| **Figure 2.2** | Activity Diagram: AI Stylist Phối Costume (2 hướng) & Thử đồ Wearson AI | **`Activity Diagram`** |
| **Figure 2.3** | Comprehensive Analysis Class Diagram: Mua sắm, Tìm kiếm & AI Stylist / Wearson Try-On *(Gộp Fig 2.3 & 2.4 chuẩn mẫu 4.1)* | **`Class Diagram`** |
| **Figure 2.4** | Analysis Class Diagram MVC/BCE (`in/out/sub` View + Control + Entity) | **`Class Diagram`** |
| **Figure 2.5** | Analysis Sequence Diagram: Tìm kiếm Đa phương thức (Text / Voice / Image) | **`Sequence Diagram`** |
| **Figure 2.6** | Analysis Sequence Diagram: Tư vấn AI Stylist & Thử đồ Wearson AI | **`Sequence Diagram`** |
| **Figure 3.1** | Layered Architecture & 4-Package Diagram (`interface`, `controller`, `DAO`, `model`) *(Chuẩn mẫu 4.6)* | **`Class Diagram`** hoặc **`Package Diagram`** |
| **Figure 3.2** | Physical Data Model — ERD Crow's Foot 11 Bảng *(Chuẩn mẫu 4.3)* | **`Entity Relationship Diagram (ERD)`** |
| **Figure 3.3** | Domain Layer Design Class Diagram (`<<ORM Persistable>>`) *(Chuẩn mẫu 4.5)* | **`Class Diagram`** |
| **Figure 3.4** | Service & DAO Design Class Diagram (Kèm `<<interface>>` Realization `<\|..`) | **`Class Diagram`** |
| **Figure 3.5** | Design Sequence Diagram 1: Tìm kiếm Đa phương thức & Nới lỏng Filter (`allowedIds`) | **`Sequence Diagram`** |
| **Figure 3.6** | Design Sequence Diagram 2: AI Stylist Phối Costume & Ghép ảnh `WearsonTryOnAdapter` | **`Sequence Diagram`** |

---

# PHẦN 0: BIỂU ĐỒ BỐI CẢNH KIẾN TRÚC C4 MODEL (LEVEL 1)

## Prompt Figure 0.1 (C4 System Context Diagram - Level 1)
- **Loại biểu đồ chọn trong VP:** `C4 Diagram` hoặc `C4 Context Diagram` (hoặc `Block Definition Diagram` / `Package Diagram`)
- **Mục đích:** Mô tả bức tranh tổng thể toàn hệ thống SmartFashion Platform (MaisonAI) tương tác với người dùng thực và các hệ thống dịch vụ bên thứ ba (AI, Voice, Cổng thanh toán, Bản đồ & Đội xe giao vận tới PTIT).

```text
Create a C4 System Context Diagram (Level 1) for the SmartFashion Platform (MaisonAI) e-commerce system.
The diagram represents the high-level boundary of the platform, the human actors interacting with it, and the external third-party systems integrated for AI styling, voice recognition, payments, and realistic map logistics.

Elements:

1. People (Human Actors):
   - Customer [Person]:
     Description: End-user browsing products, searching garments via text, continuous voice, or image cropping, consulting AI Stylist for coordinated outfits, trying on clothes virtually, placing orders, and tracking deliveries to PTIT.
   - Administrator [Person]:
     Description: Platform admin managing fashion product catalogs, categories, inventory stock levels, order fulfillments, and monitoring fleet dispatch logistics.

2. Software System (In Scope):
   - SmartFashion Platform (MaisonAI) [Software System]:
     Description: Core fashion e-commerce and AI styling platform. Provides multimodal search, Gemini-powered costume orchestration, Wearson/Decart virtual try-on, cart checkout, and real-time delivery simulation to PTIT Ha Dong.

3. External Systems (Out of Scope / Third-Party Services):
   - Gemini & Decart AI API [External System]:
     Description: Multimodal generative AI cloud services. Analyzes user full-body photos, classifies body shape, coordinates 3 matching outfits, and synthesizes photorealistic virtual try-on images.
   - Mumble Voice & Web Speech STT [External System]:
     Description: Real-time streaming speech-to-text service. Converts continuous spoken Vietnamese voice into textual search queries and styling preferences.
   - Online Payment Gateways (VNPay / MoMo) [External System]:
     Description: Third-party banking and e-wallet payment providers. Processes secure transactions via ATM/Visa/QR and returns signed payment confirmation tokens.
   - OpenStreetMap & Hanoi GIS Routing Engine [External System]:
     Description: Open-source map tile server and geospatial routing provider. Supplies Hanoi cartographic tiles, arterial road coordinates, and calculates real road paths between warehouses and PTIT Ha Dong.
   - Fleet Dispatch & Logistics Service [External System]:
     Description: Intelligent logistics fleet dispatch orchestrator. Coordinates delivery vehicles (Bicycle, Motorbike, Van, Drone, Autonomous Pod, Cargo Flight) and streams real-time vehicle GPS telemetry.

Interactions and Protocols:
- Customer --> SmartFashion Platform (MaisonAI) : "Browses catalog, searches via text/voice/image, consults AI stylist, tries on virtual outfits, orders goods [HTTPS/Browser]"
- Administrator --> SmartFashion Platform (MaisonAI) : "Manages product catalog, categories, orders, and monitors dispatch telemetry [HTTPS/Browser]"
- SmartFashion Platform (MaisonAI) --> Gemini & Decart AI API : "Sends body photo and styling desires; receives body analysis, outfit recommendations, and try-on imagery [JSON/HTTPS REST API]"
- SmartFashion Platform (MaisonAI) --> Mumble Voice & Web Speech STT : "Streams microphone audio; receives transcribed Vietnamese text [WebSockets / Speech API]"
- SmartFashion Platform (MaisonAI) --> Online Payment Gateways (VNPay / MoMo) : "Submits payment checkout requests; receives payment status webhooks [HTTPS / Webhooks]"
- SmartFashion Platform (MaisonAI) --> OpenStreetMap & Hanoi GIS Routing Engine : "Fetches Hanoi map tiles, arterial road coordinates, and calculates real street distances to PTIT [HTTPS / Tile Server API]"
- SmartFashion Platform (MaisonAI) --> Fleet Dispatch & Logistics Service : "Dispatches delivery tasks; receives real-time GPS telemetry and delivery completion confirmations [HTTPS / SSE / WebSockets]"

Layout:
- Customer at top-left, Administrator at top-right.
- SmartFashion Platform (MaisonAI) centered in the middle as the core blue system.
- Gemini & Decart AI API and Mumble Voice STT positioned on the left side.
- Online Payment Gateways, OpenStreetMap GIS Engine, and Fleet Dispatch Service positioned on the right and bottom sides.
- Standard C4 color scheme: internal system in primary blue, external systems in neutral gray, human actors in navy/slate blue.
```

---

---

# PHẦN I: BIỂU ĐỒ YÊU CẦU (REQUIREMENTS DIAGRAMS)

## Prompt Figure 1.1 (System-Wide Use Case Diagram)
- **Loại biểu đồ chọn trong VP:** `Use Case Diagram`

```text
Create a UML Use Case Diagram for the SmartFashion E-Commerce System covering multimodal search, AI stylist consultation, virtual try-on, order lookup, checkout, and administration.
Strictly include ONLY 2 human actors: Customer and Admin (no external AI systems or technical services as actors).
Actors:
1. Customer (Human buyer on the left)
2. Admin (System administrator on the right)
Use Cases inside system boundary "SmartFashion E-Commerce System":
1. Search Product (FR4)
2. Search by Keyword (FR1)
3. Search by Voice (FR2)
4. Search by Image (FR3)
5. View Product (FR5)
6. Search Order (FR6)
7. View Order (FR7)
8. Make Payment (FR8)
9. Consult AI Stylist (FR13)
10. Virtual Try-On Costume (FR14)
11. Login / Logout (FR12)
12. Manage Product (FR9)
13. Manage Category (FR10)
14. Manage Order (FR11)
Relationships:
- Customer -- Search Product (FR4)
- Customer -- View Product (FR5)
- Customer -- Search Order (FR6)
- Customer -- View Order (FR7)
- Customer -- Make Payment (FR8)
- Customer -- Consult AI Stylist (FR13)
- Customer -- Login / Logout (FR12)
- Search by Keyword (FR1) --|> Search Product (FR4) : Generalization
- Search by Voice (FR2) --|> Search Product (FR4) : Generalization
- Search by Image (FR3) --|> Search Product (FR4) : Generalization
- Virtual Try-On Costume (FR14) ..> Consult AI Stylist (FR13) : <<extend>>
- Admin -- Login / Logout (FR12)
- Admin -- Manage Product (FR9)
- Admin -- Manage Category (FR10)
- Admin -- Manage Order (FR11)
Layout: Customer on the left, system boundary rectangle in the center, Admin on the right, clean black and white style.
```

---

## Prompt Figure 1.2 (Multimodal Search & AI Stylist Use Case Diagram)
- **Loại biểu đồ chọn trong VP:** `Use Case Diagram`

```text
Create a UML Use Case Diagram focusing on the Multimodal Search, AI Stylist Costume Recommendation, and Wearson AI Virtual Try-On module.
Actor:
1. Customer (Human actor on the left)
Use Cases inside system boundary "Multimodal Search & AI Stylist Studio":
1. Search Product
2. Search by Keyword
3. Search by Voice (Mumble Voice)
4. Search by Image
5. Select Garment Region on Image
6. Consult AI Stylist
7. Capture Full-Body Photo
8. Specify Styling Intent
9. Answer 4 Guided Questions
10. Speak Desires via Microphone
11. Virtual Try-On Costume (Wearson AI)
12. Add Full Costume to Cart
13. Search Order by Code
Relationships:
- Customer -- Search Product
- Customer -- Consult AI Stylist
- Customer -- Search Order by Code
- Search by Keyword --|> Search Product : Generalization
- Search by Voice (Mumble Voice) --|> Search Product : Generalization
- Search by Image --|> Search Product : Generalization
- Search by Image ..> Select Garment Region on Image : <<include>>
- Consult AI Stylist ..> Capture Full-Body Photo : <<include>>
- Consult AI Stylist ..> Specify Styling Intent : <<include>>
- Answer 4 Guided Questions --|> Specify Styling Intent : Generalization
- Speak Desires via Microphone --|> Specify Styling Intent : Generalization
- Virtual Try-On Costume (Wearson AI) ..> Consult AI Stylist : <<extend>>
- Add Full Costume to Cart ..> Consult AI Stylist : <<extend>>
Layout: Customer on the left, Search group at top-center, AI Stylist and Wearson AI group at bottom-center.
```

---

# PHẦN II: BIỂU ĐỒ PHÂN TÍCH (ANALYSIS DIAGRAMS)

## Prompt Figure 2.1 (Multimodal Search, Order Lookup & Exception Activity Diagram)
- **Loại biểu đồ chọn trong VP:** `Activity Diagram`

```text
Create a UML Activity Diagram with two vertical swimlanes ("Customer" and "System") for the Multimodal Product Search, Order Code Lookup, and Exception Handling workflow.
Swimlanes and Activities:
1. Customer swimlane:
   - Start Node
   - Open Search Interface
   - Decision Node: "Search mode?" with 3 outgoing branches:
     a) [Keyword]: Enter text query or order code
     b) [Voice]: Speak via Microphone / Mumble Voice (Ctrl+Space)
     c) [Image]: Upload outfit photo -> Select detected garment region (or full image)
   - Decision Node: "Apply UI Filter Override? (Exception 3)"
   - Click Product to View Details (FR5)
   - Add Selected Variant to Cart
2. System swimlane:
   - Transcribe speech to Vietnamese text (for Voice branch)
   - Detect garment bounding boxes & Encode selected region into image vector (for Image branch)
   - Decision Node: "Matches Order Code pattern (SF-YYYY-XXXX)? (FR6)"
     a) [Yes]: Lookup Order in OrderRepository -> Decision "Order found?" -> [Yes] Display Order details and items (FR7) -> Activity Final | [No] Display Order not found message -> Activity Final
     b) [No]: Parse text into hardFilters (category, color, price) and softTokens
   - Merge Node: Build QueryRepresentation
   - Filter products by hardFilters in ProductRepository
   - Decision Node: "Matched products < 3? (Exception 1)"
     a) [Yes]: Relax color filter from hardFilters to soft preference & re-query ProductRepository
     b) [No]: Continue
   - Decision Node: "Any results found (> 0)? (Exception 2)"
     a) [No]: Show empty notice and suggest popular keywords -> Activity Final
     b) [Yes]: Search KeywordIndex and VectorIndex within allowedIds -> Rank results and generate explanation badges -> Display SearchResult list and understood filters
   - Decision Node: "Variant stock > 0? (Exception 4)"
     a) [Yes]: Enable Add to Cart button -> Update Cart -> Activity Final
     b) [No]: Display Out of Stock badge and disable Add to Cart button -> Activity Final
Layout: Top-to-bottom flow across two swimlanes (Customer on left, System on right), clear diamond decision nodes and merge bars.
```

---

## Prompt Figure 2.2 (AI Stylist & Wearson AI Virtual Try-On Activity Diagram)
- **Loại biểu đồ chọn trong VP:** `Activity Diagram`

```text
Create a UML Activity Diagram with two vertical swimlanes ("Customer" and "System") for the Consult AI Stylist and Wearson AI Virtual Try-On workflow (FR13 and FR14).
Swimlanes and Activities:
1. Customer swimlane:
   - Start Node
   - Open AI Stylist Studio
   - Capture live full-body photo via Webcam (or upload photo)
   - Decision Node: "Choose styling intent input method?" with 2 branches:
     a) [Path 1: Guided Quiz]: Answer 4 preset multiple-choice questions (Occasion, Style Vibe, Body Fit Priority, Budget)
     b) [Path 2: Voice Mic]: Hold Ctrl+Space (Mumble Voice) or click Mic to speak styling desires in Vietnamese
   - Review 3 recommended Costumes
   - Decision Node: "Virtual Try-On with Wearson AI? (FR14)"
   - Decision Node: "Add entire Costume to Cart?"
2. System swimlane:
   - Analyze body proportions, silhouette, and skin undertone from photo (BodyAnalysisService)
   - Transcribe voice to Vietnamese text and extract styling criteria (for Voice Mic branch)
   - Merge Node: Create StylistSession with BodyAnalysisProfile and StylistPreferences
   - Retrieve in-stock products across categories (Top, Bottom/Dress, Outerwear, Accessory)
   - Mix 3 complete Costumes (Outfits) matching body shape, color harmony, and budget with AI Stylist notes
   - Display 3 complete Costumes on StylistStudioUI
   - Synthesize customer photo wearing all garments of the selected Costume via Wearson AI and display TryOnPreviewView (when Try-On is selected)
   - Batch add all ProductVariants of selected Costume into Cart -> Activity Final
Layout: Top-to-bottom flow across two swimlanes (Customer on left, System on right).
```

---

## Prompt Figure 2.3 (Comprehensive Analysis Class Diagram — Gộp Core Mua sắm, Tìm kiếm & AI Stylist / Thử đồ Wearson AI)
- **Loại biểu đồ chọn trong VP:** `Class Diagram`
- **Mục đích:** Hợp nhất toàn bộ các lớp phân tích nghiệp vụ của hệ thống (Danh mục, Sản phẩm với cấu trúc kế thừa phân loại ngành thời trang: Quần áo, Giày dép, Phụ kiện; Tìm kiếm Đa phương thức; Giỏ hàng; Đơn hàng; Phiên AI Stylist; Hồ sơ vóc dáng; Bộ phối Trang phục và Thử đồ Wearson AI) trên một sơ đồ tổng thể, chuẩn mẫu Figure 4.1 và đáp ứng tiêu chí Bảng đen (Rubric ANALYSIS).

```text
Create a UML Analysis Class Diagram for the complete SmartFashion E-Commerce, Multimodal Search, AI Stylist Consultation, and Wearson AI Virtual Try-On system.
This diagram consolidates the core catalog with specialized product inheritance hierarchy, search query representations, shopping cart, customer orders, AI body profiling, multi-item costume composition, and virtual try-on into a unified business domain model.
Classes carry pure business meaning (no technical IDs, no foreign keys, no attribute types, no Controller/Service/Repository).

Classes and attributes/methods:
1. User:
   - Attributes: fullName, email, phone, role, createdAt
   - Operations: +login(), +logout(), +startStylistSession(photo), +placeOrder(cart)
2. Category:
   - Attributes: name, slug, description
   - Operations: +subtreeSlugs(), +assignParent(parentCategory)
3. Product (Superclass):
   - Attributes: name, handle, basePrice, description, soldCount, rating, imageUrl, status
   - Operations: +isAvailable(), +matchHardFilters(filters), +primaryInStockVariant()
4. Clothing (Subclass inherits from Product):
   - Attributes: fabricMaterial, genderTarget, clothingStyle, season, careInstruction
   - Operations: +isSeasonal(season), +matchesFabricPreference(material)
5. Footwear (Subclass inherits from Product):
   - Attributes: upperMaterial, soleType, heelHeightCm, shoeType
   - Operations: +fitsOccasion(occasion), +hasComfortSole()
6. Accessory (Subclass inherits from Product):
   - Attributes: accessoryType, dimensions, strapMaterial, hardwareColor
   - Operations: +canHoldEssentials(), +matchesVibe(vibe)
7. ProductVariant:
   - Attributes: sku, colorCode, colorName, size, price, stockQuantity
   - Operations: +hasStock(quantity), +deductStock(quantity), +adjustStock(newStock)
8. QueryRepresentation:
   - Attributes: rawText, modality, hardFilters, softTokens, relaxedFilters, selectedBox, createdAt
   - Operations: +relaxColorFilter(), +overrideWithUiFilters(uiFilters)
9. SearchResult:
   - Attributes: rank, score, badges
   - Operations: +attachExplanationBadge(badge)
10. Cart:
    - Attributes: updatedAt
    - Operations: +addItem(variant, quantity), +addFullCostume(outfit), +removeItem(variant), +calculateSubtotal()
11. CartItem:
    - Attributes: quantity
    - Operations: +updateQuantity(quantity), +lineAmount()
12. Order:
    - Attributes: orderCode, totalAmount, shippingFee, orderStatus, paymentStatus, shippingAddress, createdAt
    - Operations: +calculateTotal(), +updateStatus(newStatus), +markPaid()
13. OrderItem:
    - Attributes: productNameSnapshot, colorNameSnapshot, sizeSnapshot, quantity, unitPrice
    - Operations: +lineAmount()
14. StylistSession:
    - Attributes: userPhotoUrl, inputMode, occasion, styleVibe, fitGoal, budgetLimit, voiceTranscript, createdAt
    - Operations: +applyQuizAnswers(answers), +applyVoicePrompt(transcript), +selectCostume(outfit)
15. BodyAnalysisProfile:
    - Attributes: bodyShape, shoulderHipRatio, undertone, heightEstimate, recommendedFit, avoidNote
    - Operations: +evaluateSilhouette(), +matchesFitGoal(fitGoal)
16. Outfit:
    - Attributes: title, styleTag, occasion, stylistNote, matchScore, matchBadges, totalPrice
    - Operations: +calculateTotalPrice(), +isWithinBudget(limit), +verifyAllItemsInStock()
17. OutfitItem:
    - Attributes: slotRole, isMainItem
    - Operations: +replaceVariant(variant)
18. TryOnSession:
    - Attributes: userImageUrl, resultImageUrl, status, fitConfidence, drapeNote, createdAt
    - Operations: +synthesizeCompositePreview(), +toggleBeforeAfterComparison()

Inheritance (Generalization):
- Clothing --|> Product (Generalization with hollow triangle arrowhead)
- Footwear --|> Product (Generalization with hollow triangle arrowhead)
- Accessory --|> Product (Generalization with hollow triangle arrowhead)

Relationships and Multiplicities:
- Category "0..1" -- "0..*" Category : parent of >
- Category "1" -- "0..*" Product : categorizes >
- Product "1" *-- "1..*" ProductVariant : has > (Composition)
- User "1" -- "0..*" QueryRepresentation : submits >
- QueryRepresentation "1" *-- "0..*" SearchResult : produces > (Composition)
- SearchResult "0..*" --> "1" Product : ranks >
- User "1" -- "0..1" Cart : owns >
- Cart "1" *-- "0..*" CartItem : contains > (Composition)
- CartItem "0..*" --> "1" ProductVariant : selects >
- User "1" -- "0..*" Order : places >
- Order "1" *-- "1..*" OrderItem : includes > (Composition)
- OrderItem "0..*" --> "1" ProductVariant : locks stock of >
- User "1" -- "0..*" StylistSession : requests >
- StylistSession "1" *-- "1" BodyAnalysisProfile : analyzes > (Composition)
- StylistSession "1" *-- "1..*" Outfit : recommends > (Composition)
- Outfit "1" *-- "2..*" OutfitItem : composed of > (Composition)
- OutfitItem "0..*" --> "1" Product : picks >
- OutfitItem "0..*" --> "1" ProductVariant : defaults to >
- StylistSession "1" -- "0..*" TryOnSession : previews in >
- TryOnSession "0..*" --> "0..1" Outfit : wears >
- Outfit "0..1" ..> Cart : batch adds to >

Layout:
- Product placed in the center with its 3 subclasses (Clothing, Footwear, Accessory) directly below it with hollow generalization arrows.
- ProductVariant connected to Product via composition to the right.
- Category placed directly above Product.
- User and Multimodal Search cluster (QueryRepresentation, SearchResult) at top-left.
- Shopping Cart and Order fulfillment cluster (Cart, CartItem, Order, OrderItem) at bottom-left.
- AI Stylist and Virtual Try-On cluster (StylistSession, BodyAnalysisProfile, Outfit, OutfitItem, TryOnSession) on the right side.
- Clean orthogonal lines, balanced distribution, clear black and white style.
```

---

## Prompt Figure 2.4 (MVC / BCE Analysis Class Diagram — Chuẩn PTIT `in/out/sub`)
- **Loại biểu đồ chọn trong VP:** `Class Diagram`

```text
Create a UML Analysis Class Diagram showing Boundary (View), Control, and Entity classes following the PTIT naming convention (prefix UI inputs with "in", UI outputs with "out", and action triggers with "sub").
Boundary Classes (<<boundary>>):
1. SearchUI <<boundary>>:
   - Attributes: inQuery, subSearch
   - Operations: +actionPerformed()
2. VoiceInput <<boundary>>:
   - Attributes: inVoice, outTranscript, subMic
   - Operations: +actionPerformed()
3. ImageUpload <<boundary>>:
   - Attributes: inImage, inSelectedBox, subUpload
   - Operations: +actionPerformed()
4. SearchResultView <<boundary>>:
   - Attributes: outFilters, outRelaxedNotice, outResults, subFilter, subProduct
   - Operations: +renderResults()
5. OrderLookupView <<boundary>>:
   - Attributes: outOrderInfo, outOrderItems
   - Operations: +renderOrder()
6. StylistStudioUI <<boundary>>:
   - Attributes: inBodyPhoto, inQuizAnswers, inVoicePrompt, outBodyAnalysis, outCostumes, subGenerateCostumes, subTryOnCostume, subAddCostume
   - Operations: +actionPerformed()
7. TryOnPreviewView <<boundary>>:
   - Attributes: outPreviewImage, subCompare
   - Operations: +renderPreview()
8. AdminDashboardUI <<boundary>>:
   - Attributes: inProductForm, inCategoryForm, inOrderStatus, outInventoryTable, outOrderList, subSaveProduct, subSaveCategory, subUpdateOrder
   - Operations: +actionPerformed()
Control Classes (<<control>>):
9. SearchController <<control>>:
   - Operations: +search(), +searchImage(), +lookupOrder()
10. SearchOrchestrator <<control>>:
    - Operations: +search()
11. StylistController <<control>>:
    - Operations: +recommend(), +tryOn()
12. StylistOrchestrator <<control>>:
    - Operations: +recommendCostumes(), +tryOnCostume()
13. AdminController <<control>>:
    - Operations: +saveProduct(), +saveCategory(), +updateOrderStatus()
Relationships:
- SearchUI --> SearchController
- VoiceInput --> SearchController
- ImageUpload --> SearchController
- SearchController --> SearchOrchestrator
- SearchController --> SearchResultView
- SearchController --> OrderLookupView
- StylistStudioUI --> StylistController
- StylistController --> StylistOrchestrator
- StylistController --> TryOnPreviewView
- AdminDashboardUI --> AdminController
Layout: Boundary classes in top row, Control classes in middle row, Orchestrators in bottom row, clean black and white style.
```

---

## Prompt Figure 2.5 (Multimodal Search Analysis Sequence Diagram)
- **Loại biểu đồ chọn trong VP:** `Sequence Diagram`

```text
Create a UML Analysis Sequence Diagram for the Multimodal Product Search and Filter Relaxation scenario (FR1, FR2, FR3, FR4).
Participants (Left to Right):
1. Actor: Customer
2. Boundary: SearchUI
3. Control: SearchController
4. Control: SearchOrchestrator
5. Control: SpeechService
6. Control: QueryService
7. Control: SearchService
8. Entity: ProductRepository
9. Control: RankingService
10. Boundary: SearchResultView
Interactions (Numbered):
1. Customer -> SearchUI: 1. Enter text / Speak voice / Upload image & click Search
2. SearchUI -> SearchController: 2. Submit search request
3. SearchController -> SearchOrchestrator: 3. Coordinate multimodal search
4. [opt fragment: Voice modality] SearchOrchestrator -> SpeechService: 4. Transcribe Vietnamese speech to text
5. SpeechService --> SearchOrchestrator: 5. Return transcript text
6. SearchOrchestrator -> QueryService: 6. Build QueryRepresentation (hardFilters, softTokens, vector)
7. QueryService --> SearchOrchestrator: 7. Return QueryRepresentation
8. SearchOrchestrator -> SearchService: 8. Retrieve matching candidate products
9. SearchService -> ProductRepository: 9. Filter product IDs matching hardFilters
10. ProductRepository --> SearchService: 10. Return allowed product IDs (auto-relax color filter if < 3 matches)
11. SearchService -> SearchService: 11. Search keyword and vector indexes within allowed IDs
12. SearchService --> SearchOrchestrator: 12. Return candidate scores (RetrievalResult)
13. SearchOrchestrator -> RankingService: 13. Rank candidates and generate explanation badges
14. RankingService --> SearchOrchestrator: 14. Return ranked SearchResult list
15. SearchOrchestrator --> SearchController: 15. Return SearchResponse
16. SearchController --> SearchResultView: 16. Display understood filters, relaxation notice, and ranked products
```

---

## Prompt Figure 2.6 (AI Stylist & Wearson AI Try-On Analysis Sequence Diagram)
- **Loại biểu đồ chọn trong VP:** `Sequence Diagram`

```text
Create a UML Analysis Sequence Diagram for the Consult AI Stylist and Wearson AI Virtual Try-On scenario (FR13 and FR14).
Participants (Left to Right):
1. Actor: Customer
2. Boundary: StylistStudioUI
3. Control: StylistController
4. Control: StylistOrchestrator
5. Control: BodyAnalysisService
6. Control: StylingIntentService
7. Control: CostumeMixerService
8. Entity: ProductRepository
9. Control: WearsonTryOnService
10. Boundary: TryOnPreviewView
Interactions (Numbered):
1. Customer -> StylistStudioUI: 1. Capture live body photo & submit 4 quiz answers (or speak via Mumble Voice Mic)
2. StylistStudioUI -> StylistController: 2. Send styling consultation request
3. StylistController -> StylistOrchestrator: 3. Coordinate AI Stylist recommendation
4. StylistOrchestrator -> BodyAnalysisService: 4. Analyze body shape, proportions, and undertone from photo
5. BodyAnalysisService --> StylistOrchestrator: 5. Return BodyAnalysisProfile
6. StylistOrchestrator -> StylingIntentService: 6. Normalize quiz answers or extract criteria from voice transcript
7. StylingIntentService --> StylistOrchestrator: 7. Return StylistPreferences (occasion, styleVibe, fitGoal, budgetLimit)
8. StylistOrchestrator -> CostumeMixerService: 8. Mix 3 complete Costumes matching body shape and preferences
9. CostumeMixerService -> ProductRepository: 9. Fetch in-stock products across Top, Bottom/Dress, Outerwear, and Accessory
10. ProductRepository --> CostumeMixerService: 10. Return available products
11. CostumeMixerService --> StylistOrchestrator: 11. Return 3 curated Outfit objects with stylist notes
12. StylistOrchestrator --> StylistController: 12. Return StylistSession
13. StylistController --> StylistStudioUI: 13. Display 3 recommended Costumes
14. Customer -> StylistStudioUI: 14. Click "Try On Costume with Wearson AI" on selected Outfit
15. StylistStudioUI -> StylistController: 15. Request virtual try-on (userPhotoUrl, selectedOutfit)
16. StylistController -> StylistOrchestrator: 16. Delegate virtual try-on
17. StylistOrchestrator -> WearsonTryOnService: 17. Synthesize customer photo wearing all garments of selectedOutfit
18. WearsonTryOnService --> StylistOrchestrator: 18. Return TryOnSession with resultImageUrl
19. StylistOrchestrator --> StylistController: 19. Return TryOnSession
20. StylistController --> TryOnPreviewView: 20. Render composite virtual try-on preview and Before/After toggle
```

---

# PHẦN III: BIỂU ĐỒ THIẾT KẾ (SYSTEM DESIGN DIAGRAMS)

## Prompt Figure 3.1 (Layered Architecture & 4-Package Diagram — Chuẩn theo mẫu Figure 4.6 của bạn)
- **Loại biểu đồ chọn trong VP:** `Class Diagram` (hoặc `Package Diagram`)

```text
Create a Layered Architecture Class Diagram in UML showing the 4 distinct packages (interface, controller, DAO, model) and downward <<use>> dependencies for the SmartFashion E-Commerce system with Multimodal Search, AI Stylist, and Wearson AI Virtual Try-On.
Packages and Classes:
1. interface (Presentation View Layer):
   - SearchUI (inQuery, subSearch, actionPerformed)
   - VoiceInput (inVoice, outTranscript, subMic, actionPerformed)
   - ImageUpload (inImage, inSelectedBox, subUpload, actionPerformed)
   - SearchResultView (outFilters, outRelaxedNotice, outResults, subFilter, subProduct)
   - OrderLookupView (outOrderInfo, outOrderItems)
   - StylistStudioUI (inBodyPhoto, inQuizAnswers, inVoicePrompt, outBodyAnalysis, outCostumes, subGenerateCostumes, subTryOnCostume, subAddCostume)
   - TryOnPreviewView (outPreviewImage, subCompare)
   - AdminDashboardUI (inProductForm, inCategoryForm, inOrderStatus, subSaveProduct, subSaveCategory, subUpdateOrder)
2. controller (Controllers, Orchestrators, Application Services & Strategy Interfaces):
   - SearchController (search, searchImage, lookupOrder)
   - SearchOrchestrator (search, transcribeVoice)
   - QueryService (build)
   - SearchService (retrieve, rebuildIndexes)
   - RankingService (rank, generateBadges)
   - StylistController (recommend, tryOn, tryOnProduct)
   - StylistOrchestrator (recommendCostumes, tryOnCostume, recordAndTranscribeVoice)
   - BodyAnalysisService (analyze)
   - StylingIntentService (extractFromVoice)
   - CostumeMixerService (mixCostumes)
   - WearsonTryOnService (synthesize)
   - QueryParser <<interface>> (parse)
   - ImageEncoder <<interface>> (detectObjects, encode)
   - SpeechToText <<interface>> (transcribe)
   - TryOnEngine <<interface>> (synthesize)
3. DAO (Data Access & Search Indexes Layer):
   - ProductRepository <<interface>> (get, listAll, findIds, subtreeSlugs, save, updateVariantStock, listCategories, saveCategory, deleteCategory)
   - JsonProductRepository (get, listAll, findIds, subtreeSlugs, save, updateVariantStock)
   - PostgresProductRepository (get, listAll, findIds, subtreeSlugs, save, updateVariantStock)
   - OrderRepository (findByCode, listAll, create, updateStatus)
   - StylistRepository (saveSession, getLatestSession, saveTryOn)
   - VectorIndex (add, search)
   - KeywordIndex (build, search)
4. model (Domain Entity Layer):
   - User, Category, Product (Superclass), Clothing (Subclass), Footwear (Subclass), Accessory (Subclass), ProductVariant, Cart, CartItem, QueryRepresentation, SearchResult, StylistSession, BodyAnalysisProfile, Outfit, OutfitItem, TryOnSession, Order, OrderItem, BoundingBox
Dependencies (All downward <<use>>):
- interface ..> controller : <<use>>
- SearchController ..> SearchOrchestrator, OrderRepository : <<use>>
- SearchOrchestrator ..> SpeechToText, QueryService, SearchService, RankingService : <<use>>
- SearchService ..> ProductRepository, KeywordIndex, VectorIndex : <<use>>
- StylistController ..> StylistOrchestrator : <<use>>
- StylistOrchestrator ..> BodyAnalysisService, StylingIntentService, CostumeMixerService, WearsonTryOnService, StylistRepository : <<use>>
- CostumeMixerService ..> ProductRepository : <<use>>
- controller ..> model : <<use>>
- DAO ..> model : <<use>>
Layout: Top-to-bottom layers (interface at top, controller in upper-middle, DAO in lower-middle, model at bottom).
```

---

## Prompt Figure 3.2 (Physical Data Model - ERD — Chuẩn theo mẫu Figure 4.3 của bạn & Rubric DATAMODEL / DataBase revised)
- **Loại biểu đồ chọn trong VP:** `Entity Relationship Diagram`
- **Mục đích:** Biểu diễn Data Model vật lý ánh xạ đầy đủ cấu trúc Kế thừa Table-Per-Subclass (Joined Table Inheritance: bảng `products` liên kết `clothes`, `footwear`, `accessories`), Giỏ hàng (`carts`, `cart_items`), Hồ sơ vóc dáng (`body_analysis_profiles`), Đơn hàng kèm Snapshot lịch sử và Tìm kiếm / AI Stylist.

```text
Create a Physical Entity Relationship Diagram (ERD) using Crow's Foot notation for the complete SmartFashion Multimodal Search, AI Stylist, Virtual Try-On, and Order Management system in PostgreSQL.
The ERD implements Table-Per-Subclass (Joined Table Inheritance) for specialized fashion products, matching the Analysis and Design Class diagrams.

Tables and Columns:
1. users: user_id (PK uuid), email (varchar, UNIQUE), password_hash (text), full_name (varchar), phone (varchar, nullable), role (varchar), created_at (timestamptz)
2. categories: category_id (PK uuid), parent_id (FK uuid, nullable), slug (varchar, UNIQUE), name (varchar), description (text)
3. products (Superclass Table): product_id (PK uuid), category_id (FK uuid), name (varchar), base_price (numeric), description (text), sold_count (integer), rating (real), image_url (text), image_alt_url (text), text_embedding (vector), image_embedding (vector), status (varchar)
4. clothes (Subclass Table): product_id (PK FK uuid), fabric_material (varchar), gender_target (varchar), clothing_style (varchar), season (varchar), care_instruction (varchar)
5. footwear (Subclass Table): product_id (PK FK uuid), upper_material (varchar), sole_type (varchar), heel_height_cm (real), shoe_type (varchar)
6. accessories (Subclass Table): product_id (PK FK uuid), accessory_type (varchar), dimensions (varchar), strap_material (varchar), hardware_color (varchar)
7. product_variants: variant_id (PK uuid), product_id (FK uuid), sku (varchar, UNIQUE), color_code (varchar), color_name (varchar), size (varchar), price (numeric), stock_quantity (integer)
8. carts: cart_id (PK uuid), user_id (FK uuid, UNIQUE), updated_at (timestamptz)
9. cart_items: cart_item_id (PK uuid), cart_id (FK uuid), variant_id (FK uuid), quantity (integer)
10. query_representations: query_id (PK uuid), user_id (FK uuid, nullable), modality (varchar), raw_text (text), hard_filters (jsonb), soft_tokens (jsonb), relaxed_filters (jsonb), created_at (timestamptz)
11. search_results: result_id (PK uuid), query_id (FK uuid), product_id (FK uuid), rank (integer), score (real), badges (jsonb)
12. stylist_sessions: stylist_session_id (PK uuid), user_id (FK uuid, nullable), user_photo_url (text), input_mode (varchar), body_shape (varchar), preferences (jsonb), voice_transcript (text, nullable), created_at (timestamptz)
13. body_analysis_profiles: profile_id (PK uuid), stylist_session_id (FK uuid, UNIQUE), body_shape (varchar), shoulder_hip_ratio (real), undertone (varchar), height_estimate (real), recommended_fit (varchar), avoid_note (varchar)
14. outfits: outfit_id (PK uuid), stylist_session_id (FK uuid), title (varchar), style_tag (varchar), occasion (varchar), stylist_note (text), total_price (numeric)
15. outfit_items: outfit_item_id (PK uuid), outfit_id (FK uuid), product_id (FK uuid), variant_id (FK uuid), slot_role (varchar), is_main_item (boolean)
16. tryon_sessions: session_id (PK uuid), stylist_session_id (FK uuid, nullable), user_id (FK uuid, nullable), outfit_id (FK uuid, nullable), variant_id (FK uuid, nullable), user_image_url (text), result_image_url (text), status (varchar), created_at (timestamptz)
17. orders: order_id (PK uuid), order_code (varchar, UNIQUE), user_id (FK uuid), total_amount (numeric), shipping_fee (numeric), order_status (varchar), payment_status (varchar), shipping_address (jsonb), created_at (timestamptz)
18. order_items: order_item_id (PK uuid), order_id (FK uuid), variant_id (FK uuid), product_name_snapshot (varchar), color_name_snapshot (varchar), size_snapshot (varchar), quantity (integer), unit_price (numeric)

Foreign Key Cardinalities (Crow's Foot):
- categories (0..1) |o--o{ (0..*) categories : "parent_id"
- categories (1) ||--o{ (0..*) products : "category_id"
- products (1) ||--o| (0..1) clothes : "product_id (Inheritance PK-FK)"
- products (1) ||--o| (0..1) footwear : "product_id (Inheritance PK-FK)"
- products (1) ||--o| (0..1) accessories : "product_id (Inheritance PK-FK)"
- products (1) ||--|{ (1..*) product_variants : "product_id"
- users (1) ||--o| (0..1) carts : "user_id"
- carts (1) ||--o{ (0..*) cart_items : "cart_id"
- product_variants (1) ||--o{ (0..*) cart_items : "variant_id"
- users (0..1) |o--o{ (0..*) query_representations : "user_id"
- query_representations (1) ||--o{ (0..*) search_results : "query_id"
- products (1) ||--o{ (0..*) search_results : "product_id"
- users (0..1) |o--o{ (0..*) stylist_sessions : "user_id"
- stylist_sessions (1) ||--|| (1) body_analysis_profiles : "stylist_session_id"
- stylist_sessions (1) ||--|{ (1..*) outfits : "stylist_session_id"
- outfits (1) ||--|{ (2..*) outfit_items : "outfit_id"
- products (1) ||--o{ (0..*) outfit_items : "product_id"
- product_variants (1) ||--o{ (0..*) outfit_items : "variant_id"
- stylist_sessions (0..1) |o--o{ (0..*) tryon_sessions : "stylist_session_id"
- outfits (0..1) |o--o{ (0..*) tryon_sessions : "outfit_id"
- product_variants (0..1) |o--o{ (0..*) tryon_sessions : "variant_id"
- users (1) ||--o{ (0..*) orders : "user_id"
- orders (1) ||--|{ (1..*) order_items : "order_id"
- product_variants (1) ||--o{ (0..*) order_items : "variant_id"

Layout:
- Place Category at the top.
- Place products in the upper-center, with clothes, footwear, accessories arranged directly below products with 1-to-(0..1) joined inheritance lines.
- Place product_variants to the right of products.
- Place User and Cart / CartItem at top-left.
- Place Order and OrderItem at bottom-left.
- Place QueryRepresentation and SearchResult at lower-center.
- Place StylistSession, BodyAnalysisProfile, Outfit, OutfitItem, and TryOnSession on the right side.
```

---

## Prompt Figure 3.3 (Domain Layer Design Class Diagram — Chuẩn theo mẫu Figure 4.5 & Thầy yêu cầu: Class Diagram sinh Data Model ORM)
- **Loại biểu đồ chọn trong VP:** `Class Diagram`
- **Mục đích:** Biểu đồ Lớp Miền (Domain Class Diagram) chuẩn hóa toàn bộ các Entity để Visual Paradigm thực hiện ORM Synchronization sinh ra Data Model / ERD. Bao gồm: Stereotype `<<ORM Persistable>>`, cây kế thừa Generalization từ `Product` xuống `Clothing`, `Footwear`, `Accessory`, đầy đủ bội số `1..*` và Role Labels trên mọi mối quan hệ (Khớp 100% mục DATAMODEL trên Bảng đen của Thầy: "class Diagram + [ 1...* / label / ORM ]").

```text
Create a UML Design Class Diagram for the Domain layer (package: model) of the SmartFashion E-Commerce platform to generate the Relational Data Model via Visual Paradigm ORM.
Every entity class represents a persistent domain entity with stereotype <<ORM Persistable>>.
All attributes are private (-) with concrete types (String, Integer, Real, Boolean, String[], Real[]).
All operations are public (+) with exact parameters and return types.
Object references are drawn as navigable associations with role names and multiplicities on every end.
Generalization inheritance is drawn from Product to specialized fashion subclasses (Clothing, Footwear, Accessory).

Classes:
1. User <<ORM Persistable>>:
   - userId: String, fullName: String, email: String, phone: String, role: String, createdAt: String
   + isAdmin(): Boolean
   + placeOrder(cart: Cart): Order
2. Category <<ORM Persistable>>:
   - categoryId: String, slug: String, name: String, description: String
   + isRootCategory(): Boolean
   + subtreeSlugs(): String[]
3. Product <<ORM Persistable>>:
   - productId: String, handle: String, name: String, categorySlug: String, basePrice: Integer, description: String, soldCount: Integer, rating: Real, imageUrl: String, status: String
   + isAvailable(): Boolean
   + primaryVariant(): ProductVariant
   + matchHardFilters(filters: String): Boolean
4. Clothing <<ORM Persistable>>:
   - fabricMaterial: String, genderTarget: String, clothingStyle: String, season: String, careInstruction: String
   + isSeasonal(season: String): Boolean
   + matchesFabricPreference(material: String): Boolean
5. Footwear <<ORM Persistable>>:
   - upperMaterial: String, soleType: String, heelHeightCm: Real, shoeType: String
   + fitsOccasion(occasion: String): Boolean
   + hasComfortSole(): Boolean
6. Accessory <<ORM Persistable>>:
   - accessoryType: String, dimensions: String, strapMaterial: String, hardwareColor: String
   + canHoldEssentials(): Boolean
   + matchesVibe(vibe: String): Boolean
7. ProductVariant <<ORM Persistable>>:
   - variantId: String, sku: String, colorCode: String, colorName: String, size: String, price: Integer, stockQuantity: Integer
   + isInStock(): Boolean
   + adjustStock(newStock: Integer): Boolean
8. Cart <<ORM Persistable>>:
   - cartId: String, updatedAt: String
   + addItem(variant: ProductVariant, quantity: Integer): void
   + addFullCostume(outfit: Outfit): void
   + calculateSubtotal(): Integer
9. CartItem <<ORM Persistable>>:
   - cartItemId: String, quantity: Integer
   + updateQuantity(qty: Integer): void
   + lineAmount(): Integer
10. QueryRepresentation <<ORM Persistable>>:
    - queryId: String, rawText: String, modality: String, hardFiltersJson: String, softTokens: String[], relaxedFilters: String[], vector: Real[], createdAt: String
    + relaxColorFilter(): Boolean
    + hasOrderCodePattern(): Boolean
11. SearchResult <<ORM Persistable>>:
    - resultId: String, rank: Integer, score: Real, badges: String[]
    + matchPercentage(): Integer
    + attachExplanationBadge(badge: String): void
12. StylistSession <<ORM Persistable>>:
    - stylistSessionId: String, userPhotoUrl: String, inputMode: String, bodyShape: String, occasion: String, styleVibe: String, budgetLimit: Integer, voiceTranscript: String, createdAt: String
    + topRecommendedOutfit(): Outfit
    + applyQuizAnswers(answers: String): void
13. BodyAnalysisProfile <<ORM Persistable>>:
    - profileId: String, bodyShape: String, shoulderHipRatio: Real, undertone: String, heightEstimate: Real, recommendedFit: String, avoidNote: String
    + evaluateSilhouette(): String
    + matchesFitGoal(fitGoal: String): Boolean
14. Outfit <<ORM Persistable>>:
    - outfitId: String, title: String, styleTag: String, occasion: String, stylistNote: String, matchScore: Integer, matchBadges: String[], totalPrice: Integer
    + calculateTotalPrice(): Integer
    + isWithinBudget(limit: Integer): Boolean
15. OutfitItem <<ORM Persistable>>:
    - outfitItemId: String, slotRole: String, isMainItem: Boolean
    + replaceVariant(variant: ProductVariant): void
16. TryOnSession <<ORM Persistable>>:
    - sessionId: String, userImageUrl: String, resultImageUrl: String, status: String, fitConfidence: Integer, drapeNote: String, createdAt: String
    + synthesizeCompositePreview(): void
    + toggleBeforeAfterComparison(): void
17. Order <<ORM Persistable>>:
    - orderId: String, orderCode: String, totalAmount: Integer, shippingFee: Integer, orderStatus: String, paymentStatus: String, shippingAddressJson: String, createdAt: String
    + grandTotal(): Integer
    + updateStatus(status: String): Boolean
18. OrderItem <<ORM Persistable>>:
    - orderItemId: String, productNameSnapshot: String, colorNameSnapshot: String, sizeSnapshot: String, quantity: Integer, unitPrice: Integer
    + lineAmount(): Integer

Inheritance (Generalization):
- Clothing --|> Product (Generalization with hollow triangle arrowhead)
- Footwear --|> Product (Generalization with hollow triangle arrowhead)
- Accessory --|> Product (Generalization with hollow triangle arrowhead)

Associations, Role Names, and Multiplicities:
- Category "0..*" --> "0..1 parent" Category
- Product "0..*" --> "1 category" Category
- Product "1" *--> "1..* variants" ProductVariant (Composition)
- User "1" --> "0..1 cart" Cart
- Cart "1" *--> "0..* items" CartItem (Composition)
- CartItem "0..*" --> "1 selectedVariant" ProductVariant
- User "1" --> "0..* submittedQueries" QueryRepresentation
- QueryRepresentation "1" *--> "0..* results" SearchResult (Composition)
- SearchResult "0..*" --> "1 product" Product
- User "1" --> "0..* requestedSessions" StylistSession
- StylistSession "1" *--> "1 bodyProfile" BodyAnalysisProfile (Composition)
- StylistSession "1" *--> "1..* recommendedOutfits" Outfit (Composition)
- Outfit "1" *--> "2..* items" OutfitItem (Composition)
- OutfitItem "0..*" --> "1 product" Product
- OutfitItem "0..*" --> "1 variant" ProductVariant
- StylistSession "1" --> "0..* previewSessions" TryOnSession
- TryOnSession "0..*" --> "0..1 wornOutfit" Outfit
- User "1" --> "0..* placedOrders" Order
- Order "1" *--> "1..* orderItems" OrderItem (Composition)
- OrderItem "0..*" --> "1 lockedVariant" ProductVariant
- Outfit "0..1" ..> Cart : batch adds to >

Layout:
- Product placed in the center with Clothing, Footwear, Accessory arranged horizontally directly below Product, connected with Generalization arrows.
- ProductVariant placed to the right of Product with Composition diamond.
- Category placed directly above Product.
- User, Cart, CartItem placed at top-left.
- Order and OrderItem placed at bottom-left.
- QueryRepresentation and SearchResult placed below User.
- StylistSession, BodyAnalysisProfile, Outfit, OutfitItem, and TryOnSession placed on the right side.
- Clean orthogonal lines, balanced distribution, black and white UML style.
```

---

## Prompt Figure 3.4 (Application & DAO Design Class Diagram with Interface Realization)
- **Loại biểu đồ chọn trong VP:** `Class Diagram`

```text
Create a UML Design Class Diagram for the Controller, Orchestrator, Pluggable Strategy Interfaces, and DAO Repositories of the SmartFashion system.
All attributes are private (-) with types; all methods are public (+) with typed parameters and return types.
Strategy Interfaces and Concrete Implementations (Interface Realization <|..):
1. QueryParser <<interface>>:
   + parse(text: String): ParsedIntent
2. RuleQueryParser:
   + parse(text: String): ParsedIntent
3. LlmQueryParser:
   + parse(text: String): ParsedIntent
4. ImageEncoder <<interface>>:
   + detectObjects(image: File): BoundingBox[]
   + encode(image: File, box: BoundingBox, hintText: String): Real[]
5. ColorHistogramEncoder:
   + detectObjects(image: File): BoundingBox[]
   + encode(image: File, box: BoundingBox, hintText: String): Real[]
6. ClipImageEncoder:
   + detectObjects(image: File): BoundingBox[]
   + encode(image: File, box: BoundingBox, hintText: String): Real[]
7. SpeechToText <<interface>>:
   + transcribe(audio: Blob, langHint: String): String
8. MumbleVoiceAdapter:
   - hotkey: String
   - mode: String
   + transcribe(audio: Blob, langHint: String): String
9. WebSpeechAdapter:
   + transcribe(audio: Blob, langHint: String): String
10. TryOnEngine <<interface>>:
    + synthesize(userPhoto: String, garments: Product[]): String
11. WearsonTryOnAdapter:
    + synthesize(userPhoto: String, garments: Product[]): String
12. ProductRepository <<interface>>:
    + get(id: String): Product
    + listAll(): Product[]
    + findIds(hardFilters: HardFilters): String[]
    + subtreeSlugs(slug: String): String[]
    + save(product: Product): Product
    + updateVariantStock(variantId: String, newStock: Integer): Product
13. JsonProductRepository:
    - products: Product[]
    - categories: Category[]
    + get(id: String): Product
    + findIds(hardFilters: HardFilters): String[]
    + subtreeSlugs(slug: String): String[]
    + save(product: Product): Product
14. PostgresProductRepository:
    + get(id: String): Product
    + findIds(hardFilters: HardFilters): String[]
    + subtreeSlugs(slug: String): String[]
    + save(product: Product): Product
Controllers, Orchestrators, Services, and Indexes:
15. SearchController:
    - orchestrator: SearchOrchestrator
    - orderRepo: OrderRepository
    - parser: QueryParser
    - encoder: ImageEncoder
    + search(body: SearchRequest): SearchResponse
    + searchImage(image: File, box: BoundingBox, text: String): SearchResponse
    + lookupOrder(orderCode: String): Order
16. SearchOrchestrator:
    - speechService: SpeechToText
    - queryService: QueryService
    - searchService: SearchService
    - rankingService: RankingService
    + search(text: String, image: File, modality: String, box: BoundingBox): SearchResponse
17. QueryService:
    - parser: QueryParser
    - encoder: ImageEncoder
    + build(text: String, image: File, modality: String, box: BoundingBox): QueryRepresentation
18. SearchService:
    - productRepo: ProductRepository
    - keywordIndex: KeywordIndex
    - vectorIndex: VectorIndex
    + retrieve(rep: QueryRepresentation): RetrievalResult
19. RankingService:
    - productRepo: ProductRepository
    + rank(rep: QueryRepresentation, candidates: RetrievalResult): SearchResult[]
    + generateBadges(product: Product, rep: QueryRepresentation): String[]
20. StylistController:
    - stylistOrchestrator: StylistOrchestrator
    + recommend(request: StylistRequest): StylistSession
    + tryOn(userPhoto: String, outfit: Outfit): TryOnSession
21. StylistOrchestrator:
    - bodyService: BodyAnalysisService
    - speechService: SpeechToText
    - intentService: StylingIntentService
    - mixerService: CostumeMixerService
    - tryOnService: WearsonTryOnService
    + recommendCostumes(photoUrl: String, quizAnswers: Map, voiceText: String, mode: String): StylistSession
    + tryOnCostume(photoUrl: String, outfit: Outfit): TryOnSession
22. CostumeMixerService:
    - productRepo: ProductRepository
    + mixCostumes(bodyProfile: BodyAnalysisProfile, preferences: StylistPreferences): Outfit[]
23. WearsonTryOnService:
    - engine: TryOnEngine
    + synthesize(userPhoto: String, garments: Product[], outfitId: String): TryOnSession
24. VectorIndex:
    + add(ids: String[], vectors: Real[][]): void
    + search(vector: Real[], k: Integer, allowedIds: String[]): Map
25. KeywordIndex:
    + build(products: Product[]): void
    + search(tokens: String[], k: Integer, allowedIds: String[]): Map
Relationships:
- RuleQueryParser ..|> QueryParser : Realization
- LlmQueryParser ..|> QueryParser : Realization
- ColorHistogramEncoder ..|> ImageEncoder : Realization
- ClipImageEncoder ..|> ImageEncoder : Realization
- MumbleVoiceAdapter ..|> SpeechToText : Realization
- WebSpeechAdapter ..|> SpeechToText : Realization
- WearsonTryOnAdapter ..|> TryOnEngine : Realization
- JsonProductRepository ..|> ProductRepository : Realization
- PostgresProductRepository ..|> ProductRepository : Realization
- SearchController --> SearchOrchestrator
- SearchOrchestrator --> QueryService
- SearchOrchestrator --> SearchService
- SearchOrchestrator --> RankingService
- QueryService --> QueryParser
- QueryService --> ImageEncoder
- SearchService --> ProductRepository
- SearchService --> KeywordIndex
- SearchService --> VectorIndex
- StylistController --> StylistOrchestrator
- StylistOrchestrator --> CostumeMixerService
- StylistOrchestrator --> WearsonTryOnService
- CostumeMixerService --> ProductRepository
- WearsonTryOnService --> TryOnEngine
Layout: Controllers and Orchestrators at top, Services in middle, Strategy Interfaces and Concrete Implementations at bottom.
```

---

## Prompt Figure 3.5 (Multimodal Search & Filter Relaxation Design Sequence Diagram)
- **Loại biểu đồ chọn trong VP:** `Sequence Diagram`

```text
Create a UML Design Sequence Diagram for Multimodal Product Search showing exact method signatures, return types, and Exception 1 (Filter Relaxation when allowedIds.length < 3).
Lifelines (Left to Right):
1. Actor: Customer
2. Boundary: SearchUI
3. Control: SearchController
4. Control: SearchOrchestrator
5. Control: SpeechToText
6. Control: QueryService
7. Control: QueryParser
8. Control: ImageEncoder
9. Control: SearchService
10. Entity: ProductRepository
11. Entity: KeywordIndex
12. Entity: VectorIndex
13. Control: RankingService
14. Boundary: SearchResultView
Method Calls (Numbered):
1. Customer -> SearchUI: 1. actionPerformed()
2. SearchUI -> SearchController: 2. search(request: SearchRequest): SearchResponse
3. SearchController -> SearchOrchestrator: 3. search(text, imageFile, modality, selectedBox, uiOverrides): SearchResponse
4. [opt fragment: modality == "voice"] SearchOrchestrator -> SpeechToText: 4. transcribe(audio, "vi-VN"): String
5. SpeechToText --> SearchOrchestrator: 5. transcript: String
6. SearchOrchestrator -> QueryService: 6. build(text, imageFile, modality, selectedBox, uiOverrides): QueryRepresentation
7. [alt fragment: modality == "text" or "voice"] QueryService -> QueryParser: 7a. parse(text): ParsedIntent
8. QueryParser --> QueryService: 8a. parsedIntent: ParsedIntent
9. [else fragment: modality == "image"] QueryService -> ImageEncoder: 7b. encode(imageFile, selectedBox, text): Real[]
10. ImageEncoder --> QueryService: 8b. imageVector: Real[]
11. QueryService --> SearchOrchestrator: 9. rep: QueryRepresentation
12. SearchOrchestrator -> SearchService: 10. retrieve(rep): RetrievalResult
13. SearchService -> ProductRepository: 11. findIds(rep.hardFilters): String[]
14. ProductRepository --> SearchService: 12. allowedIds: String[]
15. [opt fragment: Exception 1 (allowedIds.length < 3 and rep.hardFilters.color != null)]
    - SearchService -> QueryRepresentation: 13a. relaxColorFilter(): Boolean
    - SearchService -> ProductRepository: 13b. findIds(relaxedHardFilters): String[]
    - ProductRepository --> SearchService: 13c. allowedIds: String[]
16. SearchService -> KeywordIndex: 14. search(rep.softTokens, k, allowedIds): Map<String, Real>
17. KeywordIndex --> SearchService: 15. keywordScores: Map<String, Real>
18. SearchService -> VectorIndex: 16. search(rep.vector, k, allowedIds): Map<String, Real>
19. VectorIndex --> SearchService: 17. vectorScores: Map<String, Real>
20. SearchService --> SearchOrchestrator: 18. candidates: RetrievalResult
21. SearchOrchestrator -> RankingService: 19. rank(rep, candidates): SearchResult[]
22. RankingService --> SearchOrchestrator: 20. results: SearchResult[]
23. SearchOrchestrator --> SearchController: 21. response: SearchResponse
24. SearchController --> SearchResultView: 22. renderResults(response)
```

---

## Prompt Figure 3.6 (AI Stylist & Wearson AI Try-On Design Sequence Diagram)
- **Loại biểu đồ chọn trong VP:** `Sequence Diagram`

```text
Create a UML Design Sequence Diagram for AI Stylist Costume Mixing and Wearson AI Virtual Try-On showing exact method calls and return types (FR13 and FR14).
Lifelines (Left to Right):
1. Actor: Customer
2. Boundary: StylistStudioUI
3. Control: StylistController
4. Control: StylistOrchestrator
5. Control: BodyAnalysisService
6. Control: StylingIntentService
7. Control: CostumeMixerService
8. Entity: ProductRepository
9. Entity: StylistRepository
10. Control: WearsonTryOnService
11. Control: TryOnEngine
12. Boundary: TryOnPreviewView
Method Calls (Numbered):
1. Customer -> StylistStudioUI: 1. actionPerformed() (inBodyPhoto + inQuizAnswers or inVoicePrompt)
2. StylistStudioUI -> StylistController: 2. recommend(request: StylistRequest): StylistSession
3. StylistController -> StylistOrchestrator: 3. recommendCostumes(photoUrl, quizAnswers, voiceText, inputMode): StylistSession
4. StylistOrchestrator -> BodyAnalysisService: 4. analyze(photoUrl): BodyAnalysisProfile
5. BodyAnalysisService --> StylistOrchestrator: 5. bodyProfile: BodyAnalysisProfile
6. [opt fragment: inputMode == "voice"]
   - StylistOrchestrator -> StylingIntentService: 6. extractFromVoice(voiceText): StylistPreferences
   - StylingIntentService --> StylistOrchestrator: 7. preferences: StylistPreferences
7. StylistOrchestrator -> CostumeMixerService: 8. mixCostumes(bodyProfile, preferences): Outfit[]
8. CostumeMixerService -> ProductRepository: 9. listAll(): Product[]
9. ProductRepository --> CostumeMixerService: 10. inStockProducts: Product[]
10. CostumeMixerService --> StylistOrchestrator: 11. recommendedOutfits: Outfit[] (3 Costumes)
11. StylistOrchestrator -> StylistRepository: 12. saveSession(session): StylistSession
12. StylistOrchestrator --> StylistController: 13. session: StylistSession
13. StylistController --> StylistStudioUI: 14. renderCostumes(session.recommendedOutfits)
14. Customer -> StylistStudioUI: 15. subTryOnCostume(selectedOutfit: Outfit)
15. StylistStudioUI -> StylistController: 16. tryOn(userPhotoUrl, selectedOutfit): TryOnSession
16. StylistController -> StylistOrchestrator: 17. tryOnCostume(userPhotoUrl, selectedOutfit): TryOnSession
17. StylistOrchestrator -> WearsonTryOnService: 18. synthesize(userPhotoUrl, garments, outfitId, stylistSessionId): TryOnSession
18. WearsonTryOnService -> TryOnEngine: 19. synthesize(userPhotoUrl, garments): String
19. TryOnEngine --> WearsonTryOnService: 20. resultImageUrl: String
20. WearsonTryOnService --> StylistOrchestrator: 21. tryOnSession: TryOnSession
21. StylistOrchestrator -> StylistRepository: 22. saveTryOn(tryOnSession): TryOnSession
22. StylistOrchestrator --> StylistController: 23. tryOnSession: TryOnSession
23. StylistController --> TryOnPreviewView: 24. renderPreview(tryOnSession)
```
