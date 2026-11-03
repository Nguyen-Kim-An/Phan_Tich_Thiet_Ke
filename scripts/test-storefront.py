from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tmp" / "ui-qa"
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = "http://127.0.0.1:3053"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    errors = []
    bad_responses = []
    page.on("console", lambda msg: errors.append(f"{msg.text} @ {msg.location}") if msg.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: bad_responses.append(f"{response.status} {response.url}") if response.status >= 400 else None)

    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    expect(page.get_by_role("heading", name="Quiet form, clear intention.")).to_be_visible()
    expect(page.locator(".category-card")).to_have_count(6)
    display_font = page.locator(".hero-overlay h1").evaluate("el => getComputedStyle(el).fontFamily")
    assert "Gloock" in display_font, display_font
    page.screenshot(path=OUT / "home-desktop.png", full_page=True)
    page.locator(".bag-button").click()
    expect(page.locator(".cart-drawer")).to_have_class("cart-drawer open")
    page.get_by_label("Đóng giỏ hàng").click()

    page.goto(f"{BASE_URL}/shop")
    page.wait_for_load_state("networkidle")
    page.locator(".category-tabs").get_by_role("link", name="Váy", exact=True).click()
    page.wait_for_timeout(700)
    assert "category=vay" in page.url, page.url
    page.wait_for_load_state("networkidle")
    expect(page.locator(".shop-grid .product-card")).to_have_count(3)
    expect(page.get_by_role("heading", name="Váy", exact=True)).to_be_visible()
    page.get_by_label("Dưới 2.000.000₫", exact=True).check()
    expect(page.locator(".shop-grid .product-card")).to_have_count(1)
    page.get_by_role("button", name="Xóa bộ lọc kích cỡ & giá").click()
    expect(page.locator(".shop-grid .product-card")).to_have_count(3)
    page.screenshot(path=OUT / "shop-desktop.png", full_page=True)

    first_card = page.locator(".shop-grid .product-card").first
    first_card.hover()
    quick_add = first_card.locator(".quick-add")
    expect(quick_add).to_be_visible()
    quick_add.click()
    expect(page.locator(".cart-drawer")).to_have_class("cart-drawer open")
    expect(page.get_by_text("Tạm tính", exact=True)).to_be_visible()
    page.get_by_label("Đóng giỏ hàng").click()
    page.wait_for_timeout(350)

    page.locator(".shop-grid .product-image a").first.click()
    page.wait_for_url("**/product/**")
    page.wait_for_load_state("networkidle")
    expect(page.locator(".detail-gallery img")).to_have_count(2)
    expect(page.get_by_role("button", name="Thêm vào túi")).to_be_visible()
    page.screenshot(path=OUT / "product-desktop.png", full_page=True)

    mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    mobile.goto(BASE_URL)
    mobile.wait_for_load_state("networkidle")
    assert mobile.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")
    mobile.screenshot(path=OUT / "home-mobile.png", full_page=True)
    mobile.get_by_label("Mở menu").click()
    expect(mobile.locator(".mobile-nav")).to_have_class("mobile-nav open")
    mobile.screenshot(path=OUT / "mobile-menu.png")
    mobile.close()

    assert not errors, f"Browser console errors: {errors}; failed responses: {bad_responses}"
    print("PASS: home, local fonts, categories, price filter, quick-add, cart, detail gallery, mobile menu, overflow, console")
    browser.close()
