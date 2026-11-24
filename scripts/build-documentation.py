"""Generate the technical report. Pass the final repository and video URLs as arguments."""
import sys
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, PageBreak

output = 'submission/AutoPoint-Technical-Documentation.pdf'
navy = colors.HexColor('#14263b')
teal = colors.HexColor('#08776e')
light = colors.HexColor('#eaf2f6')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle('CoverTitle', fontName='Helvetica-Bold', fontSize=32, leading=37, textColor=navy))
styles.add(ParagraphStyle('SectionTitle', fontName='Helvetica-Bold', fontSize=23, leading=28, textColor=navy, spaceAfter=16))
styles.add(ParagraphStyle('Label', fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=teal, spaceAfter=8))
styles.add(ParagraphStyle('Copy', fontSize=10.5, leading=15, textColor=navy, spaceAfter=10))
styles.add(ParagraphStyle('Cell', fontSize=9, leading=12, textColor=navy))
document = []

def text(value, style='Copy'):
    document.append(Paragraph(value, styles[style]))

def section(title):
    document.append(PageBreak())
    text('AUTOPOINT  /  ITEC 116', 'Label')
    text(title, 'SectionTitle')

def table(head, body, widths):
    cells = [[Paragraph('<b>' + escape(item) + '</b>', styles['Cell']) for item in head]]
    cells += [[Paragraph(escape(item), styles['Cell']) for item in row] for row in body]
    view = Table(cells, colWidths=widths, repeatRows=1, hAlign='LEFT')
    view.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), light),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f6f9fb')]),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, teal),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    document.extend([view, Spacer(1, 14)])

def submission_link(label, index):
    url = sys.argv[index] if len(sys.argv) > index else ''
    text(f'<b>{label}</b><br/>' + (f'<link href="{escape(url)}" color="#08776e">{escape(url)}</link>' if url else 'Pending student submission'))

document.append(Spacer(1, 83))
text('TECHNICAL DOCUMENTATION  /  FINAL PROJECT', 'Label')
text('Integrated Point of Sale System for Automotive Dealerships &amp; Parts Retailers', 'CoverTitle')
document.append(Spacer(1, 28))
text('<b>Lance Capistrano</b>  |  BSIT-4D<br/>ITEC 116 &mdash; Systems Integration and Architecture 2<br/>Instructor: John Vincent A. Dallego, MIT')
document.append(Spacer(1, 20))
submission_link('GitHub repository', 1)
submission_link('Narrated demonstration', 2)

section('Contents and system analysis')
table(['Section', 'Page'], [
    ('Project overview and system analysis', '2'), ('System architecture and backend implementation', '3'),
    ('Database design', '4'), ('REST API design', '5'), ('Security, validation, conclusion, and references', '6'),
], [410, 87])
text('Project overview', 'Label')
text('AutoPoint provides a web-based sales counter and stock management workspace for automotive dealerships and parts retailers. The catalog supports parts, accessories, and vehicles. Each completed sale connects the cashier, optional customer, line items, payment, and receipt.')
text('System analysis', 'Label')
text('Separately maintained stock and sales records can cause quantity discrepancies and slow down receipt preparation. A shared transaction records payment, decrements stock, and generates a receipt together. Cashiers can process sales and update customer records. Administrators maintain the product catalog, categories, stock levels, and staff accounts.')
text('Functional scope', 'Label')
text('The browser supports SKU search, walk-in or registered customer sales, pending-sale cancellation, cash payment with change, card terminal reference recording, low-stock indicators, and printable receipts. The system records a completed terminal payment using its reference. Electronic payment processing remains external to the prototype.')

section('Architecture and implementation')
text('Request flow', 'Label')
table(['Layer', 'Responsibility'], [
    ('React browser / Postman', 'Collect input and send JSON over HTTP to /api/v1. Protected calls carry a bearer JWT.'),
    ('NestJS controller', 'Match the route, run authorization guards, and validate inputs before invoking a service.'),
    ('NestJS service', 'Enforce business rules for catalog, sales, inventory, payment, and receipts.'),
    ('TypeORM repository / manager', 'Map entity fields to tables and execute reads and writes. Use a transaction manager for related writes.'),
    ('MySQL Community Server', 'Persist normalized records and enforce key and uniqueness constraints.'),
], [168, 329])
text('Trace a product creation request', 'Label')
text('Postman sends POST /api/v1/products with a JWT and a CreateProductDto body. ProductsController delegates to ProductsService. The service checks the category and SKU, then uses a TypeORM transaction manager to insert the product and its inventory row. MySQL returns the generated identifiers. The controller responds with HTTP 201 and the new product.')
text('Transaction boundaries', 'Label')
text('Adding or removing a sale item locks the pending sale while its total changes. Recording payment locks the sale, checks available inventory under row locks, then commits payment, stock changes, completed status, and receipt together. Any failed write rolls back the complete payment transaction.')

section('Database design')
text('Read each row as a relationship from the parent key to the child foreign key. Unique foreign keys enforce the two one-to-one relationships.')
table(['Parent key', 'Child foreign key', 'Cardinality'], [
    ('categories.category_id', 'products.category_id', '1 to many'),
    ('products.product_id', 'inventory.product_id', '1 to 1'),
    ('user_accounts.user_id', 'sales.user_id', '1 to many'),
    ('customers.customer_id', 'sales.customer_id', '1 to many, optional customer'),
    ('sales.sale_id', 'sale_items.sale_id', '1 to many'),
    ('products.product_id', 'sale_items.product_id', '1 to many'),
    ('sales.sale_id', 'payments.sale_id', '1 to many'),
    ('sales.sale_id', 'receipts.sale_id', '1 to 1'),
], [171, 171, 155])
text('Keys and normalization', 'Label')
text('Each entity has an auto-incrementing integer primary key. Category names, product codes, usernames, and receipt numbers are unique. An optional customer ID supports walk-in sales. Sale items preserve the unit price at the time the item was added. Decimal columns preserve currency precision.')
text('Schema delivery', 'Label')
text('The schema-only MySQL export contains nine tables with their indexes and foreign keys. Application credentials and demonstration records are stored separately.')

section('REST API design')
text('All routes below use the /api/v1 prefix. Only session creation is public. The Postman collection includes request bodies, examples of filtering, and status assertions for 31 method-path routes.')
table(['Resource', 'Methods and paths'], [
    ('Sessions', 'POST /sessions'),
    ('Users', 'GET and POST /users, PATCH /users/:id'),
    ('Categories', 'GET and POST /categories, GET/PATCH/DELETE /categories/:id'),
    ('Products', 'GET and POST /products, GET/PUT/PATCH/DELETE /products/:id'),
    ('Inventory', 'GET /inventory-records, PATCH /inventory-records/:id'),
    ('Customers', 'GET and POST /customers, PATCH /customers/:id'),
    ('Sales', 'GET and POST /sales, GET/PATCH /sales/:id'),
    ('Sale items', 'GET and POST /sales/:id/items, DELETE /sales/:id/items/:itemId'),
    ('Payments', 'POST /payments, GET /payments/:id'),
    ('Receipts', 'GET /receipts?saleId=:saleId, GET /receipts/:id'),
], [105, 392])
text('Example request and response', 'Label')
text('<b>POST /payments</b><br/>{&quot;saleId&quot;:7,&quot;paymentMethod&quot;:&quot;Cash&quot;,&quot;amountPaid&quot;:600.50}<br/><b>201 Created</b> &mdash; A sale totaling 501.00 returns an approved payment with change of 99.50. A repeated payment returns 409.')
text('Successful reads and updates return 200. Creation returns 201 and deletion returns 204. Validation, authentication, authorization, missing records, and conflicts use 400, 401, 403, 404, and 409 respectively.')

section('Security and verification')
text('Authentication and authorization', 'Label')
text('Login compares the submitted password with a bcrypt hash. A successful login returns a signed JWT, which expires after one hour by default. The guard checks the bearer token and confirms the account is still active. Admin-only routes use a separate role check. DTO validation rejects unsupported body fields.')
text('API testing and validation', 'Label')
table(['Representative check', 'Observed result'], [
    ('Request without token', '401 Unauthorized'),
    ('Product CRUD', '201 create, 200 read and update, 204 delete, 404 after deletion'),
    ('Cash checkout at 501.00', '201 payment, 99.50 change, stock decreased from 5 to 3'),
    ('Repeated payment', '409 Conflict'),
    ('Cashier adjusts stock', '403 Forbidden'),
], [220, 277])
text('The 44-request verification script passed against MySQL Community Server 26.10 and runs the same request sequence as the Postman collection. Run the collection in Postman for the narrated walkthrough and capture representative responses for submission.')
text('Conclusion', 'Label')
text('The prototype integrates checkout and inventory in one transaction and gives staff a browser interface for the same REST resources used in Postman. Next steps for a production rollout include terminal gateway integration, HTTPS deployment, and database migrations.')
text('References', 'Label')
text('Capistrano, L. <i>System Integration and Architecture Activities 3 to 6.</i><br/>Dallego, J. V. A. <i>ITEC 116 Final Project Student Copy.</i><br/>NestJS documentation (docs.nestjs.com), TypeORM documentation (typeorm.io), and MySQL Reference Manual (dev.mysql.com/doc/).')

def footer(canvas, doc):
    canvas.setStrokeColor(light)
    canvas.line(49, 47, 546, 47)
    canvas.setFillColor(navy)
    canvas.setFont('Helvetica', 9)
    canvas.drawString(49, 32, 'AUTOPOINT  /  TECHNICAL DOCUMENTATION')
    canvas.drawRightString(546, 32, str(doc.page))

SimpleDocTemplate(output, pagesize=A4, leftMargin=49, rightMargin=49, topMargin=50,
                  bottomMargin=63, title='AutoPoint Technical Documentation',
                  author='Lance Capistrano').build(document, onFirstPage=footer, onLaterPages=footer)


