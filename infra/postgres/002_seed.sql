INSERT INTO users (user_id,email,password_hash,full_name,role) VALUES
('10000000-0000-0000-0000-000000000001','admin@smartfashion.vn',crypt('Admin123!',gen_salt('bf')),'Quản trị SmartFashion','admin'),
('10000000-0000-0000-0000-000000000002','linh@example.com',crypt('Customer123!',gen_salt('bf')),'Nguyễn Hà Linh','customer');

INSERT INTO categories (category_id,name,parent_id) VALUES
('20000000-0000-0000-0000-000000000001','Áo',NULL),
('20000000-0000-0000-0000-000000000002','Quần',NULL),
('20000000-0000-0000-0000-000000000003','Váy',NULL),
('20000000-0000-0000-0000-000000000004','Áo khoác',NULL),
('20000000-0000-0000-0000-000000000005','Phụ kiện',NULL),
('20000000-0000-0000-0000-000000000006','Áo sơ mi','20000000-0000-0000-0000-000000000001');

INSERT INTO products (product_id,category_id,name,base_price,description,status) VALUES
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006','Sơ mi Linen Form Rộng',690000,'Linen nhẹ, phom thả và đường may tối giản.','active'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Quần Suông Studio',890000,'Quần cạp cao, ly đứng dành cho nhịp sống thành thị.','active'),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','Váy Lụa No. 07',1290000,'Váy midi cắt xéo, bề mặt lụa mờ.','active'),
('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','Blazer Cấu Trúc Mềm',1590000,'Blazer vai mềm với tỷ lệ hiện đại.','active');

INSERT INTO product_variants (variant_id,product_id,sku,color_code,color_name,size,price_override,stock_quantity) VALUES
('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','SM-LIN-WHT-S','#F1F0EA','Trắng ngà','S',NULL,12),
('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','SM-LIN-WHT-M','#F1F0EA','Trắng ngà','M',NULL,8),
('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','Q-STU-BLK-M','#151515','Đen','M',NULL,16),
('40000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000003','V-LUA-BLU-S','#8EA6C8','Xanh khói','S',NULL,5),
('40000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000004','BLZ-GRY-M','#777973','Xám đá','M',NULL,3);

INSERT INTO product_images (product_id,variant_id,image_url,is_primary) VALUES
('30000000-0000-0000-0000-000000000001',NULL,'/products/linen-shirt.svg',true),
('30000000-0000-0000-0000-000000000002',NULL,'/products/studio-trousers.svg',true),
('30000000-0000-0000-0000-000000000003',NULL,'/products/silk-dress.svg',true),
('30000000-0000-0000-0000-000000000004',NULL,'/products/soft-blazer.svg',true);

INSERT INTO outfits (outfit_id,title,style_tag,created_by) VALUES
('50000000-0000-0000-0000-000000000001','Thành thị trong trẻo','minimal','10000000-0000-0000-0000-000000000001');
INSERT INTO outfit_items (outfit_id,product_id,is_main_item) VALUES
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',true),
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',false),
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000004',false);
