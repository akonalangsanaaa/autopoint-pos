const assert = require('node:assert/strict');
const fs = require('node:fs');

const run = Date.now().toString(36);
const steps = [
  ['Reject request without JWT', 'GET', 'products', 401, null, null, true],
  ['Log in as administrator', 'POST', 'sessions', 201, { username: '{{username}}', password: '{{password}}' }, 'token', true],
  ['List users', 'GET', 'users', 200],
  ['Create cashier', 'POST', 'users', 201, { firstName: 'Demo', lastName: 'Cashier', username: 'cash_{{run}}', password: 'Demo9!{{run}}', role: 'Cashier' }, 'userId'],
  ['Update cashier', 'PATCH', 'users/{{userId}}', 200, { accountStatus: 'Active' }],
  ['Create category', 'POST', 'categories', 201, { categoryName: 'Brakes {{run}}', productType: 'Part' }, 'categoryId'],
  ['List categories', 'GET', 'categories', 200],
  ['Read category', 'GET', 'categories/{{categoryId}}', 200],
  ['Update category', 'PATCH', 'categories/{{categoryId}}', 200, { description: 'Brake products' }],
  ['Reject invalid product', 'POST', 'products', 400, { unitPrice: -5 }],
  ['Create product', 'POST', 'products', 201, { categoryId: '{{categoryId}}', productCode: 'POS-{{run}}', productName: 'Ceramic brake pads', unitPrice: 500 }, 'productId'],
  ['List products', 'GET', 'products', 200],
  ['Find product by SKU', 'GET', 'products?productCode=POS-{{run}}', 200],
  ['Read product', 'GET', 'products/{{productId}}', 200, null, 'inventory.inventoryId'],
  ['Replace product', 'PUT', 'products/{{productId}}', 200, { categoryId: '{{categoryId}}', productCode: 'POS-{{run}}', productName: 'Ceramic brake pads', unitPrice: 500 }],
  ['Update product', 'PATCH', 'products/{{productId}}', 200, { unitPrice: 550.50 }],
  ['Delete product', 'DELETE', 'products/{{productId}}', 204],
  ['Verify product deletion', 'GET', 'products/{{productId}}', 404],
  ['Delete category', 'DELETE', 'categories/{{categoryId}}', 204],
  ['Create checkout category', 'POST', 'categories', 201, { categoryName: 'Filters {{run}}', productType: 'Part' }, 'categoryId'],
  ['Create checkout product', 'POST', 'products', 201, { categoryId: '{{categoryId}}', productCode: 'FLT-{{run}}', productName: 'Oil filter', unitPrice: 250.50 }, 'productId'],
  ['Read checkout inventory ID', 'GET', 'products/{{productId}}', 200, null, 'inventory.inventoryId'],
  ['Set opening stock', 'PATCH', 'inventory-records/{{inventoryId}}', 200, { quantityOnHand: 5, reorderLevel: 2 }],
  ['List inventory', 'GET', 'inventory-records', 200],
  ['Create customer', 'POST', 'customers', 201, { firstName: 'Demo', lastName: 'Customer', email: '{{run}}@example.com' }, 'customerId'],
  ['Search customers', 'GET', 'customers?q=Demo', 200],
  ['Update customer', 'PATCH', 'customers/{{customerId}}', 200, { contactNumber: '09123456789' }],
  ['Start checkout', 'POST', 'sales', 201, { customerId: '{{customerId}}' }, 'saleId'],
  ['List sales', 'GET', 'sales', 200],
  ['Add sale item', 'POST', 'sales/{{saleId}}/items', 201, { productId: '{{productId}}', quantity: 2 }, 'saleItemId'],
  ['Remove sale item', 'DELETE', 'sales/{{saleId}}/items/{{saleItemId}}', 204],
  ['Add item for payment', 'POST', 'sales/{{saleId}}/items', 201, { productId: '{{productId}}', quantity: 2 }, 'saleItemId'],
  ['List sale items', 'GET', 'sales/{{saleId}}/items', 200],
  ['Read sale', 'GET', 'sales/{{saleId}}', 200],
  ['Record cash payment', 'POST', 'payments', 201, { saleId: '{{saleId}}', paymentMethod: 'Cash', amountPaid: 600.50 }, 'paymentId'],
  ['Reject repeat payment', 'POST', 'payments', 409, { saleId: '{{saleId}}', paymentMethod: 'Cash', amountPaid: 600.50 }],
  ['Read payment', 'GET', 'payments/{{paymentId}}', 200],
  ['Find sale receipt', 'GET', 'receipts?saleId={{saleId}}', 200, null, 'data.0.receiptId'],
  ['Read receipt', 'GET', 'receipts/{{receiptId}}', 200],
  ['Check remaining stock', 'GET', 'inventory-records?productId={{productId}}', 200],
  ['Start second sale', 'POST', 'sales', 201, {}, 'saleId'],
  ['Cancel second sale', 'PATCH', 'sales/{{saleId}}', 200, { saleStatus: 'Cancelled' }],
  ['Log in as cashier', 'POST', 'sessions', 201, { username: 'cash_{{run}}', password: 'Demo9!{{run}}' }, 'token', true],
  ['Reject cashier stock edit', 'PATCH', 'inventory-records/{{inventoryId}}', 403, { quantityOnHand: 100 }],
];
const formatBody = body => JSON.stringify(body, null, 2).replace(/"({{(?:categoryId|productId|customerId|saleId)}})"/g, '$1');
const key = path => path.split('.').at(-1);
const pick = (object, path) => path.split('.').reduce((value, part) => value?.[part], object);

function exportCollection() {
  const item = steps.map(([name, method, path, status, body, capture, publicRoute], index) => ({
    name,
    request: {
      method,
      ...(publicRoute && { auth: { type: 'noauth' } }),
      url: '{{baseUrl}}/' + path,
      header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      ...(body && { body: { mode: 'raw', raw: formatBody(body), options: { raw: { language: 'json' } } } }),
    },
    event: [
      ...(index === 0 ? [{ listen: 'prerequest', script: { exec: ["pm.collectionVariables.set('run', Date.now().toString(36));"] } }] : []),
      { listen: 'test', script: { exec: [
        "pm.test('HTTP " + status + "', () => pm.response.to.have.status(" + status + "));",
        ...(capture ? ["if (pm.response.code === " + status + ") pm.collectionVariables.set('" + key(capture) + "', pm.response.json()" + capture.split('.').map(part => '[' + JSON.stringify(part) + ']').join('') + ');'] : []),
      ] } },
    ],
  }));
  const collection = {
    info: { name: 'AutoPoint POS API – ITEC 116', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
    variable: [{ key: 'baseUrl', value: 'http://localhost:3000/api/v1' }, { key: 'username', value: 'admin' }, { key: 'password', value: '' }, { key: 'run', value: 'demo' }],
    item,
  };
  fs.writeFileSync('submission/AutoPoint.postman_collection.json', JSON.stringify(collection, null, 2) + '\n');
}

async function verify() {
  const base = process.env.POS_BASE_URL || 'http://localhost:3000/api/v1';
  const variables = { run, username: 'admin', password: process.env.POS_ADMIN_PASSWORD };
  assert.ok(variables.password, 'Set POS_ADMIN_PASSWORD for the administrator in the test database.');
  const substitute = value => value.replace(/{{(\w+)}}/g, (_, name) => {
    assert.ok(variables[name] !== undefined, 'Missing ' + name);
    return variables[name];
  });
  for (const [label, method, path, expected, body, capture, publicRoute] of steps) {
    const response = await fetch(base + '/' + substitute(path), {
      method,
      headers: { ...(!publicRoute && { Authorization: 'Bearer ' + variables.token }), ...(body && { 'Content-Type': 'application/json' }) },
      body: body ? substitute(formatBody(body)) : undefined,
    });
    const result = response.status === 204 ? null : await response.json();
    assert.equal(response.status, expected, label + ' returned ' + response.status + ': ' + (result?.errors?.join(' ') || result?.message || ''));
    if (capture) {
      variables[key(capture)] = pick(result, capture);
      assert.ok(variables[key(capture)], label + ' did not return ' + capture);
    }
    if (label === 'Read sale') assert.equal(JSON.stringify(result).includes('passwordHash'), false);
    if (label === 'Read payment') assert.equal(Number(result.changeAmount), 99.50);
    if (label === 'Check remaining stock') assert.equal(result.data[0].quantityOnHand, 3);
    console.log(response.status, label);
  }
}

if (process.argv.includes('--export')) exportCollection();
else verify().catch(error => { console.error(error.message); process.exitCode = 1; });

