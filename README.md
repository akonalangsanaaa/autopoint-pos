# Integrated Point of Sale System for Automotive Dealerships & Parts Retailers

AutoPoint is an ITEC 116 project by Lance Capistrano (BSIT-4D). It combines browser-based checkout, catalog and stock management, customer records, payment recording, and printable receipts.

## Stack

NestJS 10, TypeORM 0.3, MySQL, JWT with bcrypt-compatible password hashing, React 18, and Postman. The Nest server serves the React bundle and the REST API on the same origin. Card mode records a payment already processed at a terminal using its reference number.

## Run on Windows

1. Install Node.js 20 or 22 and start MySQL. Create the database with `CREATE DATABASE pos_automotive CHARACTER SET utf8mb4;`. Use a MySQL account with access to that database.
2. Create a local `.env` file with `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=pos_automotive`, and your MySQL account in `DB_USERNAME` and `DB_PASSWORD`. Set a randomly generated `JWT_SECRET` and a unique `POS_ADMIN_PASSWORD`. Use one setting per line and keep the file local.
3. From the project directory, run:

   ```powershell
   npm.cmd ci
   npm.cmd run seed
   npm.cmd run start:dev
   ```

4. Open [AutoPoint](http://localhost:3000/) and sign in as `admin` using the password set in step 2. Restart the development command after changing frontend source. Use `npm.cmd run build` to compile both layers.

The development seed creates the admin only if that username is absent. When using the existing local test setup created during development, the admin password is already stored in the ignored `.env` under `POS_ADMIN_PASSWORD`.

## Demonstrate the system

Create a category, add a product, and adjust its opening quantity under **Inventory**. Open **Checkout**, start a walk-in sale or pick a customer, add a product, and record a cash payment. The completed sale appears in **Sales**, and the receipt can be printed or saved to PDF from the browser. Stock decreases when payment is recorded.

## API and submission files

All API paths start with `/api/v1`. Login returns a JWT via `POST /sessions`. Use that token in the `Authorization: Bearer <token>` header on all other routes. Categories and products support full CRUD. Administrators manage staff, categories, products, and stock. Signed-in cashiers can read the catalog and stock, maintain customers, and process sales.

- [Postman collection](submission/AutoPoint.postman_collection.json) contains 44 ordered requests with expected status codes. Import it, set the local `password` collection variable, and run on a practice database. Start with **Reject request without JWT** so the run gets unique sample keys. The run creates demonstration records.
- [SQL export](submission/pos_automotive.sql) is a schema-only export. Import it into an empty MySQL database if you prefer to create the schema before startup. Set `DB_SYNCHRONIZE=false` when using the imported schema. Start with an empty database to avoid table-name conflicts during import.
- [Technical documentation](submission/AutoPoint-Technical-Documentation.pdf) describes the architecture, database, API, and verification. Add your final GitHub and narrated video links to the cover before submission.

To repeat API verification from PowerShell after starting the app:

```powershell
$env:POS_ADMIN_PASSWORD = (Get-Content .env | Where-Object { $_ -like 'POS_ADMIN_PASSWORD=*' }).Split('=',2)[1]
node scripts/verify-api.cjs
```



## MySQL Workbench

Workbench is the desktop client used to inspect and query the MySQL server. In Workbench, create a **Standard TCP/IP** connection using the values from your local .env file.

| Connection field | Local demonstration |
| --- | --- |
| Hostname | 127.0.0.1 |
| Port | 33317 |
| Username | pos_local |
| Password | DB_PASSWORD in .env |
| Default Schema | pos_automotive |

For your own MySQL service, use its configured port (commonly 3306) and user. To review a checkout in the demo, refresh **Schemas**, expand **pos_automotive**, then inspect sales, sale_items, payments, receipts and inventory. The SQL export can also be opened as a SQL script in Workbench and executed with an empty target schema selected.

The local demo uses MySQL Community Server 26.10 and the POS on port 3001. Set the Postman baseUrl to http://localhost:3001/api/v1 when using this demo.

## Final project walkthrough

Use the collection in Postman and record your own narration in this order:

1. Start NestJS with npm run start:dev.
2. Run the administrator login request and show that the response contains a token. Keep its value out of the submitted recording.
3. Demonstrate product create, read, update, and delete in Postman.
4. Trace the product creation request through ProductsController, ProductsService, the TypeORM transaction manager, and the MySQL tables.
5. Run the request without a token and show the 401 response.
6. In Workbench, show the product deletion or a completed sale, its payment and receipt, and the matching inventory change.

Rebuild the technical documentation with your actual repository and video URLs by running python scripts/build-documentation.py REPOSITORY_URL VIDEO_URL in an environment with ReportLab.

Oracle documents full Workbench support for MySQL 8.0. Some Workbench features may be unavailable with later MySQL versions. The POS and schema export were verified with MySQL Community Server 26.10.
