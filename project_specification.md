# Smart Inventory Management System - Project Specification & Blueprint

This document contains the complete structural, visual, database, and backend specification required for generating the Smart Inventory Management System. It is designed to be easily read, parsed, and implemented by an AI code generator.

---

## 1. System Architecture & Tech Stack

The system is structured as a clean Model-View-Controller (MVC) web application using PHP (v8.1+) and MongoDB.

- **Frontend:** HTML5, CSS3, Bootstrap 5.3 (via CDN), custom CSS styles, FontAwesome 6 (for icons), and Chart.js or ApexCharts (for dashboard charts).
- **Backend:** Raw PHP using a structured routing system. Composer packages are utilized for MongoDB driver and configuration.
- **Database:** MongoDB (using the official PHP Library `mongodb/mongodb`).
- **Dependencies (`composer.json`):**
  ```json
  {
      "require": {
          "mongodb/mongodb": "^1.16",
          "vlucas/phpdotenv": "^5.6"
      },
      "autoload": {
          "psr-4": {
              "App\\": "src/"
          }
      }
  }
  ```

---

## 2. Directory Structure

```text
smart-inventory/
├── config/
│   └── database.php       # MongoDB connection helper
├── public/
│   ├── css/
│   │   └── styles.css     # Premium styling custom styles (based on references)
│   ├── js/
│   │   └── main.js        # Form validation, charts rendering, UI toggles
│   ├── index.php          # Front Controller / Router
│   └── uploads/           # Folder for uploaded images (products/categories)
├── src/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── DashboardController.php
│   │   ├── ProductController.php
│   │   ├── CategoryController.php
│   │   ├── SupplierController.php
│   │   └── AdminController.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Product.php
│   │   ├── Category.php
│   │   └── Supplier.php
│   └── Middleware/
│       ├── AuthMiddleware.php
│       └── AdminMiddleware.php
├── views/
│   ├── layouts/
│   │   ├── header.php     # Common Top Navbar
│   │   ├── sidebar.php    # Common Left Navigation Sidebar
│   │   └── footer.php     # Scripts & common footer HTML
│   ├── auth/
│   │   ├── login.php
│   │   └── register.php
│   ├── dashboard/
│   │   └── index.php
│   ├── products/
│   │   ├── index.php      # Products List Table
│   │   ├── add.php        # Create product form
│   │   ├── edit.php       # Update product form
│   │   └── view.php       # Read single product detail view
│   ├── categories/
│   │   └── add.php        # Create category form + preview
│   ├── suppliers/
│   │   └── add.php        # Create supplier form + preview
│   ├── analytics/
│   │   └── index.php      # Charts & reports
│   └── admin/
│       ├── users.php      # Admin panel for user CRUD
│       └── edit_user.php  # Admin edit user form
├── .env                   # DB configuration and connection strings
├── composer.json
└── project_specification.md
```

---

## 3. Database Schema Design (MongoDB)

All schemas are represented as flexible BSON documents. References are managed via `MongoDB\BSON\ObjectId` values.

### Collection: `users`
Tracks user details, roles (for admin panel authorization), and subscription details.
```json
{
  "_id": {"$oid": "666edd011fa9cb5678123456"},
  "username": "admin_user",
  "email": "admin@example.com",
  "password_hash": "$2y$10$eImiTxAkJyT37085tV...", // Bcrypt hash
  "role": "admin", // "admin" or "standard"
  "subscription_status": "pro", // "free", "pro", "enterprise"
  "created_at": {"$date": "2026-06-16T12:00:00Z"},
  "updated_at": {"$date": "2026-06-16T12:00:00Z"}
}
```
*Indexes:* Unique index on `email`, unique index on `username`.

### Collection: `categories`
Used to classify products. Supports sub-categories through hierarchical self-reference.
```json
{
  "_id": {"$oid": "666edd021fa9cb5678123457"},
  "name": "Electronics",
  "slug": "electronics",
  "parent_category_id": null, // or ObjectId of parent category
  "description": "Electronic accessories, smart gadgets, and sound systems.",
  "icon_url": "/uploads/categories/electronics_icon.png",
  "status": "active", // "active" or "inactive"
  "created_at": {"$date": "2026-06-16T12:00:00Z"}
}
```
*Indexes:* Unique index on `slug`.

### Collection: `suppliers`
Maintains records of vendors providing inventory items.
```json
{
  "_id": {"$oid": "666edd031fa9cb5678123458"},
  "name": "TechWorld Distributors",
  "code": "SUP-TECH-01",
  "contact_person": "Jane Doe",
  "designation": "Sales Manager",
  "email": "jane@techworld.com",
  "phone": "+91 9876543210",
  "alternate_phone": "+91 9876543211",
  "website": "https://techworld.com",
  "address": "123 Technology Park, Silicon Valley",
  "country": "India",
  "state": "California",
  "city": "San Jose",
  "pin_code": "95110",
  "payment_terms": "net_30", // "net_15", "net_30", "net_60"
  "credit_limit": 50000.00,
  "tax_id": "GSTIN12345678",
  "notes": "Reliable supplier for memory cards and speakers.",
  "status": "active", // "active" or "inactive"
  "created_at": {"$date": "2026-06-16T12:00:00Z"}
}
```
*Indexes:* Unique index on `code`.

### Collection: `products`
Stores inventory stock units, links to category & supplier schemas, and defines product quantities.
```json
{
  "_id": {"$oid": "666edd041fa9cb5678123459"},
  "name": "Wireless Headphones",
  "sku": "PROD-WHP-101",
  "category_id": {"$oid": "666edd021fa9cb5678123457"},
  "brand": "Sony",
  "purchase_price": 2000.00,
  "selling_price": 3000.00,
  "quantity": 50,
  "reorder_level": 10,
  "unit": "Piece",
  "tax_rate": 18.00, // percentage
  "description": "High-quality wireless headphones with active noise cancellation.",
  "image_url": "/uploads/products/wireless_headphones.png",
  "created_at": {"$date": "2026-06-16T12:00:00Z"}
}
```
*Indexes:* Unique index on `sku`, compound text search index on `name` and `sku`.

---

## 4. Design Guidelines & Visual Theme (CSS)

The CSS implementation must be built using Bootstrap 5.3 and utility overrides inside `public/css/styles.css` to reproduce the premium, sleek visual appearance in the reference screenshots.

### Style Tokens (Variables)
```css
:root {
  --primary-color: #4f46e5;       /* Modern brand violet/indigo */
  --primary-hover: #4338ca;
  --bg-color: #f8fafc;            /* Light neutral page canvas */
  --card-bg: #ffffff;
  --border-color: #e2e8f0;        /* Sleek input and box lines */
  --text-dark: #1e293b;           /* Bold headings and text */
  --text-muted: #64748b;          /* Descriptions and labels */
  --font-family: 'Inter', sans-serif;
  
  /* Status Colors */
  --status-in-stock-bg: #d1fae5;
  --status-in-stock-text: #065f46;
  --status-low-stock-bg: #fef3c7;
  --status-low-stock-text: #92400e;
  --status-out-stock-bg: #fee2e2;
  --status-out-stock-text: #991b1b;
}
```

### Visual Components & layout Classes
1. **Layout Structure:**
   - Use a flex row container for the sidebar navigation pane (`width: 260px`) and the core application area (`flex-grow: 1`).
   - The main canvas should have a subtle background (`var(--bg-color)`) and padding of `2rem`.
2. **Left Navigation Sidebar:**
   - Fixed side navigation with white background and thin right border (`1px solid var(--border-color)`).
   - Sidebar item states: Normal items have slate text (`var(--text-muted)`); active items receive a soft purple-tint background (`#e0e7ff`) with purple text (`var(--primary-color)`) and font-weight `600`.
   - Upgrade card: Purple visual card using a modern linear gradient background:
     `background: linear-gradient(135deg, #6366f1, #4f46e5);`
3. **Form Designs:**
   - Standard cards wrapping form elements should utilize a subtle shadow:
     `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);`
   - Inputs should have a `border-radius: 8px` and show an indigo border ring on focus (`box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15)`).
   - Require fields must mark their HTML label with a red asterisk using class `text-danger`.
4. **Interactive Action Panels:**
   - Form pages (e.g. Add Supplier, Add Category, Add Product) should follow a two-column distribution:
     - **Left Column (8 Cols):** Core form entries grouped inside fieldsets (e.g. Supplier Information, Product Information).
     - **Right Column (4 Cols):** Previews and quick dynamic tips card (e.g. Supplier Preview, Product Image Uploader, Category Preview).

---

## 5. Specific Features & Core Logic

### A. Product Stock Level Indicators
The inventory level display component uses a PHP-based logic class to determine the correct CSS styling dynamically.

#### Input-to-Output Color Matrix
- **Critical/Out of Stock:**
  - Logic: `quantity` <= 0
  - Text Label: "Out of Stock"
  - CSS Classes: Badge with bg `var(--status-out-stock-bg)` and text color `var(--status-out-stock-text)`.
- **Low Stock:**
  - Logic: `quantity` > 0 AND `quantity` < 10
  - Text Label: "Low Stock"
  - CSS Classes: Badge with bg `var(--status-low-stock-bg)` and text color `var(--status-low-stock-text)`.
- **In Stock:**
  - Logic: `quantity` >= 10
  - Text Label: "In Stock"
  - CSS Classes: Badge with bg `var(--status-in-stock-bg)` and text color `var(--status-in-stock-text)`.

#### PHP Rendering Snippet
```php
function getStockBadge($quantity) {
    if ($quantity <= 0) {
        return '<span class="badge" style="background-color: var(--status-out-stock-bg); color: var(--status-out-stock-text);">Out of Stock</span>';
    } elseif ($quantity < 10) {
        return '<span class="badge" style="background-color: var(--status-low-stock-bg); color: var(--status-low-stock-text);">Low Stock</span>';
    } else {
        return '<span class="badge" style="background-color: var(--status-in-stock-bg); color: var(--status-in-stock-text);">In Stock</span>';
    }
}
```

### B. User Registration & Login Authentication
- **Password Input Visibility Toggle:**
  Both registration and login password inputs require a dynamic toggle to show/hide plaintext characters.
  *Frontend UI:* Input group containing password element and clickable suffix icon element (e.g., FontAwesome `.fa-eye` / `.fa-eye-slash`).
  *Javascript Toggle Logic:*
  ```javascript
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
      btn.addEventListener('click', function() {
          const input = this.closest('.input-group').querySelector('input');
          const icon = this.querySelector('i');
          if (input.type === 'password') {
              input.type = 'text';
              icon.classList.replace('fa-eye', 'fa-eye-slash');
          } else {
              input.type = 'password';
              icon.classList.replace('fa-eye-slash', 'fa-eye');
          }
      });
  });
  ```
- **Backend Flow:**
  - **Register:** Validates unique username/email, uses `password_hash($pwd, PASSWORD_BCRYPT)` for security, and sets default subscription status to "free".
  - **Login:** Performs a user lookup on MongoDB, uses `password_verify($pwd, $hashed_pwd)` to validate coordinates, and saves the matching user data inside session variables (`$_SESSION['user_id']`, `$_SESSION['user_role']`, etc.).
  - **Authorization Middleware:** Standard routes are protected with `AuthMiddleware` checking if session keys exist. Admin-only subpages (e.g. `/admin/users`) are filtered via `AdminMiddleware` checking if `role === 'admin'`.

### C. Admin Panel & Subscription Dashboard
A secure workspace accessible only by admin roles for user lifecycle control.
- **User CRUD Table Layout:**
  Displays users inside a clean tabular list containing:
  - User ID (truncated BSON ObjectId)
  - Username
  - Email Address
  - Subscription Level (Visual badge matching subscription level: Free, Pro, Enterprise)
  - Role Status
  - Action buttons: Edit Role/Subscription, Delete User.
- **Admin Edit Actions:**
  A secure update view allowing admins to toggle subscription packages (`free`, `pro`, `enterprise`) and change user permissions (`standard` to `admin`).

---

## 6. Page-by-Page Specifications

### 1. Registration & Login Pages
- **Path:** `/views/auth/register.php` & `/views/auth/login.php`
- **UI Details:** Card-based clean center form. Inputs: Email, Password (with eye icon suffix button). Register page includes Username & Confirm Password fields.

### 2. Dashboard Interface
- **Path:** `/views/dashboard/index.php`
- **Widgets:**
  - Top Metrics (4 row cards): Total Products, Total Sales (formatted in local currency eg. ₹), Total Purchases, Low Stock Items.
  - Sales Overview (Chart): Line chart rendering monthly sales records.
  - Top Selling Products: List of top 5 items containing thumbnail, name, sales count, and revenue.
  - Low Stock Alerts: Table of low stock warnings displaying inventory counts and criticality indicators.
  - Category Distribution: Donut/Pie chart highlighting product share percentages.
  - Recent Transactions: Audit feed indicating invoice numbers, action tags (Invoice / Purchase), date/time stamps, value fields, and colorful event badges (e.g., green `+ ₹` for sales, red `- ₹` for purchases).

### 3. Add Supplier Page
- **Path:** `/views/suppliers/add.php` (See Reference Image: `Add Supplier`)
- **Left Column Content:** Form wrapping Supplier Name, Supplier Code, Contact Person, Designation, Email Address, Phone Number, alternate phone, website url, complete address, Country/State/City selectors, postal/PIN code, payment options, credit boundaries, Tax ID/GSTIN registration, and notes block.
- **Right Column Content:**
  - **Supplier Preview:** Dynamic reactive panel. Displays the entered Name, an "Active" badge, and icon listings mapping contact records (Phone, Email, Address, GSTIN) updated live via Javascript `oninput` handlers.
  - **Tips Panel:** Checklist card validating form correctness guidelines.

### 4. Add New Product Page
- **Path:** `/views/products/add.php` (See Reference Image: `Add New Product`)
- **Left Column Content:** Input forms specifying Product Name, SKU, Category select dropdown, Brand name, Purchase Price, Selling Price, Starting Quantity, Reorder Threshold, measuring Unit, applicable Tax Rate, and description block.
- **Right Column Content:**
  - **Product Image Uploader:** Interactive upload card. Displays drag/drop region, manual browse selection, and "Remove Image" visual control.
  - **Product Cost & Stock Summary Card:** Computes and displays dynamic numbers matching `Profit (Per Unit) = Selling Price - Purchase Price`, starting quantity, and reactive status badges matching stock logic. Includes info box saying: "Product will be available for sale once added to inventory."

### 5. Add Category Page
- **Path:** `/views/categories/add.php` (See Reference Image: `Add Category`)
- **Left Column Content:** Inputs for Category Name, automatic SEO friendly Slug URL generator, parent category selector, category description block, category icon file uploader, and state selector (Active / Inactive radio buttons).
- **Right Column Content:**
  - **Category Preview:** Displays category name, parent hierarchy, and icon previews in real-time.
  - **Category Tips:** Setup tips list.

### 6. Products List Page
- **Path:** `/views/products/index.php` (See Reference Image: `Products - List`)
- **Components:**
  - Search field and "+ Add Product" button at the header.
  - Table containing columns: Product ID, Product Name, Category Name, Price, Stock quantity, Status Badge, and Action dropdown (Edit/Delete).
  - Modern bootstrap pagination.

### 7. Analytics Interface
- **Path:** `/views/analytics/index.php` (See Reference Image: `Analytics`)
- **Layout:** High-fidelity dashboard mapping metrics, interactive date pickers, sales patterns line plots, categorical distribution rings, and a custom grid element: **Monthly Sales Heatmap** rendering daily transaction frequencies color-coded dynamically.

---

## 7. PHP API & MongoDB Endpoint Operations

The PHP router intercepts incoming JSON requests. The API methods perform CRUD actions on the MongoDB driver collections.

### Core DB Helper: `config/database.php`
```php
<?php
namespace App\Config;
use MongoDB\Client;

class Database {
    private static $db = null;

    public static function getConnection() {
        if (self::$db === null) {
            $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
            $dotenv->load();
            
            $uri = $_ENV['MONGODB_URI'] ?? 'mongodb://127.0.0.1:27017';
            $dbName = $_ENV['MONGODB_DB'] ?? 'smart_inventory';
            
            try {
                $client = new Client($uri);
                self::$db = $client->selectDatabase($dbName);
            } catch (\Exception $e) {
                die("Failed to connect to MongoDB: " . $e->getMessage());
            }
        }
        return self::$db;
    }
}
```

### Products CRUD Operations Interface: `src/Controllers/ProductController.php`

Below are the explicit operations the AI generator must program to integrate PHP controls with the MongoDB collection:

```php
<?php
namespace App\Controllers;
use App\Config\Database;
use MongoDB\BSON\ObjectId;

class ProductController {
    private $db;
    private $collection;

    public function __construct() {
        $this->db = Database::getConnection();
        $this->collection = $this->db->products;
    }

    // 1. READ ALL (List view with pagination and search query filter)
    public function index($request) {
        $search = $request['search'] ?? '';
        $page = isset($request['page']) ? (int)$request['page'] : 1;
        $limit = 10;
        $skip = ($page - 1) * $limit;

        $filter = [];
        if (!empty($search)) {
            $filter = [
                '$or' => [
                    ['name' => new \MongoDB\BSON\Regex($search, 'i')],
                    ['sku' => new \MongoDB\BSON\Regex($search, 'i')]
                ]
            ];
        }

        $totalDocs = $this->collection->countDocuments($filter);
        $products = $this->collection->find($filter, [
            'limit' => $limit,
            'skip' => $skip,
            'sort' => ['created_at' => -1]
        ])->toArray();

        return [
            'products' => $products,
            'totalPages' => ceil($totalDocs / $limit),
            'currentPage' => $page
        ];
    }

    // 2. CREATE PRODUCT
    public function store($data) {
        $validationResult = $this->validateProductData($data);
        if (!$validationResult['valid']) {
            return ['status' => 'error', 'errors' => $validationResult['errors']];
        }

        $document = [
            'name' => htmlspecialchars($data['name']),
            'sku' => htmlspecialchars($data['sku']),
            'category_id' => new ObjectId($data['category_id']),
            'brand' => htmlspecialchars($data['brand'] ?? ''),
            'purchase_price' => (float)$data['purchase_price'],
            'selling_price' => (float)$data['selling_price'],
            'quantity' => (int)$data['quantity'],
            'reorder_level' => (int)($data['reorder_level'] ?? 10),
            'unit' => htmlspecialchars($data['unit']),
            'tax_rate' => (float)($data['tax_rate'] ?? 0),
            'description' => htmlspecialchars($data['description'] ?? ''),
            'image_url' => htmlspecialchars($data['image_url'] ?? ''),
            'created_at' => new \MongoDB\BSON\UTCDateTime()
        ];

        $result = $this->collection->insertOne($document);
        return [
            'status' => 'success',
            'id' => (string)$result->getInsertedId()
        ];
    }

    // 3. READ SINGLE PRODUCT
    public function show($id) {
        try {
            $product = $this->collection->findOne(['_id' => new ObjectId($id)]);
            return $product;
        } catch (\Exception $e) {
            return null;
        }
    }

    // 4. UPDATE PRODUCT
    public function update($id, $data) {
        $validationResult = $this->validateProductData($data, true);
        if (!$validationResult['valid']) {
            return ['status' => 'error', 'errors' => $validationResult['errors']];
        }

        $updatePayload = [
            'name' => htmlspecialchars($data['name']),
            'sku' => htmlspecialchars($data['sku']),
            'category_id' => new ObjectId($data['category_id']),
            'brand' => htmlspecialchars($data['brand'] ?? ''),
            'purchase_price' => (float)$data['purchase_price'],
            'selling_price' => (float)$data['selling_price'],
            'quantity' => (int)$data['quantity'],
            'reorder_level' => (int)($data['reorder_level'] ?? 10),
            'unit' => htmlspecialchars($data['unit']),
            'tax_rate' => (float)($data['tax_rate'] ?? 0),
            'description' => htmlspecialchars($data['description'] ?? ''),
        ];

        if (isset($data['image_url']) && !empty($data['image_url'])) {
            $updatePayload['image_url'] = htmlspecialchars($data['image_url']);
        }

        try {
            $this->collection->updateOne(
                ['_id' => new ObjectId($id)],
                ['$set' => $updatePayload]
            );
            return ['status' => 'success'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    // 5. DELETE PRODUCT
    public function destroy($id) {
        try {
            $this->collection->deleteOne(['_id' => new ObjectId($id)]);
            return ['status' => 'success'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function validateProductData($data, $isUpdate = false) {
        $errors = [];
        if (empty($data['name'])) $errors[] = "Product name is required.";
        if (empty($data['sku'])) $errors[] = "SKU or Product code is required.";
        if (empty($data['category_id'])) $errors[] = "Category must be chosen.";
        if (!isset($data['purchase_price']) || (float)$data['purchase_price'] <= 0) $errors[] = "Invalid purchase price.";
        if (!isset($data['selling_price']) || (float)$data['selling_price'] <= 0) $errors[] = "Invalid selling price.";
        if (!isset($data['quantity']) || (int)$data['quantity'] < 0) $errors[] = "Starting stock level must be positive.";
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
}
```

### Dashboard Aggregations Interface: `src/Controllers/DashboardController.php`
Fetches all overview metrics and charts utilizing efficient MongoDB Aggregation Pipelines:

```php
<?php
namespace App\Controllers;
use App\Config\Database;

class DashboardController {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getMetrics() {
        // Total products count
        $totalProducts = $this->db->products->countDocuments();

        // Total Sales Counter (Sum aggregation)
        $salesAggregate = $this->db->sales->aggregate([
            ['$group' => ['_id' => null, 'total' => ['$sum' => '$grand_total']]]
        ])->toArray();
        $totalSales = $salesAggregate[0]['total'] ?? 0;

        // Total Purchases Counter
        $purchasesAggregate = $this->db->purchases->aggregate([
            ['$group' => ['_id' => null, 'total' => ['$sum' => '$grand_total']]]
        ])->toArray();
        $totalPurchases = $purchasesAggregate[0]['total'] ?? 0;

        // Low stock threshold products count (< 10)
        $lowStockCount = $this->db->products->countDocuments([
            'quantity' => ['$gt' => 0, '$lt' => 10]
        ]);

        return [
            'total_products' => $totalProducts,
            'total_sales' => $totalSales,
            'total_purchases' => $totalPurchases,
            'low_stock_count' => $lowStockCount
        ];
    }

    public function getCategoryDistribution() {
        // Unwinds products linked categories to compute volume sizes
        return $this->db->products->aggregate([
            ['$group' => [
                '_id' => '$category_id',
                'count' => ['$sum' => 1]
            ]],
            ['$lookup' => [
                'from' => 'categories',
                'localField' => '_id',
                'foreignField' => '_id',
                'as' => 'category_info'
            ]],
            ['$unwind' => '$category_info'],
            ['$project' => [
                'name' => '$category_info.name',
                'count' => 1
            ]]
        ])->toArray();
    }
}
```
