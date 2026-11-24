import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const title = 'Integrated Point of Sale System for Automotive Dealerships & Parts Retailers';
const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value));
const date = value => value ? new Date(value).toLocaleString('en-PH') : '—';
const name = row => [row.firstName, row.lastName].join(' ');
const routes = ['Overview', 'Checkout', 'Products', 'Inventory', 'Sales', 'Customers', 'Categories', 'Users'];
const symbols = ['◫', '▤', '◇', '▥', '▧', '♧', '▦', '♙'];
const field = (key, label, type = 'text', options, required = true) => ({ key, label, type, options, required });

async function request(path, token, method = 'GET', body) {
  const response = await fetch('/api/v1/' + path, {
    method,
    headers: { ...(token && { Authorization: 'Bearer ' + token }), ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error([result.message].flat().join(' ')), { status: response.status });
  return result;
}

async function list(api, path) {
  const rows = [];
  for (let page = 1; ; page++) {
    const result = await api(path + '?limit=100&page=' + page);
    rows.push(...result.data);
    if (!result.data.length || rows.length >= result.totalItems) return rows;
  }
}

function Table({ columns, rows, empty = 'No records found.' }) {
  if (!rows.length) return <p className="empty">{empty}</p>;
  return <div className="table-wrap"><table><thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>
    {rows.map((row, index) => <tr key={index}>{columns.map(([label, value]) => <td key={label}>{value(row)}</td>)}</tr>)}
  </tbody></table></div>;
}

function FormFields({ fields, initial }) {
  return fields.map(({ key, label, type, options, required }) => <label key={key}>{label}
    {options ? <select name={key} defaultValue={initial[key] ?? ''} required={required}>
      <option value="" disabled={required}>Select {label.toLowerCase()}</option>
      {options.map(option => { const [value, text] = Array.isArray(option) ? option : [option, option]; return <option key={value} value={value}>{text}</option>; })}
    </select> : <input name={key} type={type} defaultValue={initial[key] ?? ''} required={required}
      step={key === 'unitPrice' ? '.01' : undefined} min={type === 'number' ? 0 : undefined} autoComplete="off" />}
  </label>);
}

function App() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState('Overview');
  const [data, setData] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [sale, setSale] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const admin = session?.user.role === 'Admin';
  const { products = [], categories = [], customers = [], inventory = [], sales = [], users = [] } = data;
  const stock = new Map(inventory.map(item => [item.productId, item]));
  const matches = (...values) => values.some(value => String(value ?? '').toLowerCase().includes(search.trim().toLowerCase()));

  function logout() {
    setSession(null); setData({}); setSale(null); setDetail(null); setReceipt(null); setEditor(null); setPage('Overview');
  }

  async function api(path, method, body) {
    try { return await request(path, session.token, method, body); }
    catch (failure) { if (failure.status === 401) logout(); throw failure; }
  }

  async function refresh() {
    const keys = ['products', 'categories', 'customers', 'inventory', 'sales', ...(admin ? ['users'] : [])];
    const results = await Promise.all(keys.map(key => list(api, key === 'inventory' ? 'inventory-records' : key)));
    setData(Object.fromEntries(keys.map((key, index) => [key, results[index]])));
  }

  async function perform(action) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  useEffect(() => { if (session) perform(refresh); }, [session]);

  function navigate(next) {
    setPage(next); setSearch(''); setEditor(null); setDetail(null); setReceipt(null); setError(''); setNotice('');
  }

  async function openSale(id) { setSale(await api('sales/' + id)); }

  async function openReceipt(id) {
    const [record, result] = await Promise.all([api('sales/' + id), api('receipts?saleId=' + id)]);
    setReceipt({ sale: record, receipt: result.data[0] });
  }

  function edit(label, path, fields, initial = {}, numeric = [], deleting = false) {
    setEditor({ label, path, fields, initial, numeric, deleting, existing: Object.keys(initial).length > 0 });
    setError('');
  }

  function save(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of editor.numeric) body[key] = Number(body[key]);
    for (const item of editor.fields) if (!item.required && body[item.key] === '') delete body[item.key];
    perform(async () => {
      await api(editor.path, editor.existing ? 'PATCH' : 'POST', body);
      setEditor(null); setNotice('Changes saved.'); await refresh();
    });
  }

  const categoryOptions = categories.map(item => [item.categoryId, item.categoryName]);
  const productFields = [field('productCode', 'SKU'), field('productName', 'Product name'), field('categoryId', 'Category', 'text', categoryOptions), field('brand', 'Brand', 'text', null, false), field('unitPrice', 'Unit price', 'number'), field('description', 'Description', 'text', null, false), field('productStatus', 'Status', 'text', ['Available', 'Discontinued'], false)];
  const categoryFields = [field('categoryName', 'Category name'), field('productType', 'Product type', 'text', ['Part', 'Accessory', 'Vehicle']), field('description', 'Description', 'text', null, false)];
  const customerFields = [field('firstName', 'First name'), field('lastName', 'Last name'), field('contactNumber', 'Contact number', 'tel', null, false), field('email', 'Email', 'email', null, false), field('address', 'Address', 'text', null, false)];
  const userFields = [field('firstName', 'First name'), field('lastName', 'Last name'), field('username', 'Username'), field('password', 'Password', 'password'), field('role', 'Role', 'text', ['Cashier', 'Admin'])];
  const stockFields = [field('quantityOnHand', 'Quantity on hand', 'number'), field('reorderLevel', 'Reorder level', 'number')];
  const completed = sales.filter(row => row.saleStatus === 'Completed');
  const low = inventory.filter(row => row.quantityOnHand <= row.reorderLevel);
  const salesColumns = [['Sale', row => '#' + row.saleId], ['Date', row => date(row.saleDate)], ['Total', row => money(row.totalAmount)], ['Status', row => <span className={'badge ' + row.saleStatus.toLowerCase()}>{row.saleStatus}</span>], ['Actions', row => <button className="quiet" onClick={() => perform(async () => {
    if (row.saleStatus === 'Pending') { navigate('Checkout'); await openSale(row.saleId); }
    else if (row.saleStatus === 'Completed') await openReceipt(row.saleId);
    else setDetail(await api('sales/' + row.saleId));
  })}>{row.saleStatus === 'Pending' ? 'Resume' : row.saleStatus === 'Completed' ? 'Receipt' : 'View'}</button>]];
  const searchInput = placeholder => <input type="search" aria-label={placeholder} placeholder={placeholder} value={search} onChange={event => setSearch(event.target.value)} />;
  const button = (label, action) => <button className="primary" onClick={action} disabled={busy}>{label}</button>;
  const editorButton = action => <button className="quiet" onClick={action}>Edit</button>;
  const alert = error && <div className="alert" role="alert">{error}</div>;

  if (!session) return <main className="login">
    <section className="login-brand"><div className="brand-mark">AP</div><p className="eyebrow">AUTOPOINT</p><h1>{title}</h1><p>Sales, stock and customer records in one workspace.</p></section>
    <section className="login-form"><form onSubmit={event => {
      event.preventDefault();
      const credentials = Object.fromEntries(new FormData(event.currentTarget));
      perform(async () => setSession(await request('sessions', null, 'POST', credentials)));
    }}><h2>Sign in</h2><p>Use your staff account to open the POS.</p>{alert}
      <label>Username<input name="username" autoComplete="username" required /></label>
      <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
      <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form></section>
  </main>;

  return <div className="layout">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">AP</div><div><strong>AutoPoint</strong><small>Dealership & parts POS</small></div></div>
      <nav aria-label="Main navigation">{routes.filter(route => route !== 'Users' || admin).map(route => <button key={route} className={route === page ? 'active' : ''} aria-current={route === page ? 'page' : undefined} onClick={() => navigate(route)}><span aria-hidden="true">{symbols[routes.indexOf(route)]}</span>{route}</button>)}</nav>
      <div className="account"><strong>{name(session.user)}</strong><small>{session.user.role}</small><button onClick={logout}>Sign out</button></div>
    </aside>
    <main className="workspace"><header><div><p className="eyebrow">AUTOPOINT / {page.toUpperCase()}</p><h1>{page}</h1></div>{page === 'Overview' && button('Open checkout', () => navigate('Checkout'))}</header>
      {alert}{notice && <div className="notice" role="status">{notice}</div>}
      {busy && <p className="loading" role="status">Working…</p>}
      {page === 'Overview' && <><div className="metrics">
        {[['Recorded revenue', money(completed.reduce((sum, row) => sum + Number(row.totalAmount), 0))], ['Completed sales', completed.length], ['Catalog products', products.length], ['Low-stock records', low.length]].map(([label, value]) => <article className="panel metric" key={label}><p>{label}</p><strong>{value}</strong></article>)}
      </div><section className="panel"><div className="toolbar"><h2>Recent sales</h2><button className="quiet" onClick={() => navigate('Sales')}>View sales</button></div><Table rows={sales.slice(0, 5)} columns={salesColumns} empty="Sales will appear here after checkout starts." /></section></>}
      {page === 'Products' && <section className="panel"><div className="toolbar">{searchInput('Search name, SKU or brand')}{admin && button('Add product', () => edit('Add product', 'products', productFields, {}, ['categoryId', 'unitPrice']))}</div>
        <Table rows={products.filter(row => matches(row.productName, row.productCode, row.brand))} columns={[[ 'SKU', row => row.productCode], ['Product', row => row.productName], ['Brand', row => row.brand || '—'], ['Price', row => money(row.unitPrice)], ['Status', row => row.productStatus], ...(admin ? [['Actions', row => editorButton(() => edit('Edit product', 'products/' + row.productId, productFields, row, ['categoryId', 'unitPrice'], true))]] : [])]} />
      </section>}
      {page === 'Categories' && <section className="panel"><div className="toolbar">{searchInput('Search categories')}{admin && button('Add category', () => edit('Add category', 'categories', categoryFields))}</div>
        <Table rows={categories.filter(row => matches(row.categoryName, row.productType))} columns={[[ 'Category', row => row.categoryName], ['Type', row => row.productType], ['Description', row => row.description || '—'], ...(admin ? [['Actions', row => editorButton(() => edit('Edit category', 'categories/' + row.categoryId, categoryFields, row, [], true))]] : [])]} />
      </section>}
      {page === 'Inventory' && <section className="panel"><div className="toolbar">{searchInput('Search product or SKU')}<span>{low.length} at or below reorder level</span></div>
        <Table rows={inventory.filter(row => matches(row.product?.productName, row.product?.productCode))} columns={[[ 'SKU', row => row.product?.productCode], ['Product', row => row.product?.productName], ['On hand', row => row.quantityOnHand], ['Reorder level', row => row.reorderLevel], ['Stock', row => <span className={'badge ' + (low.includes(row) ? 'pending' : 'completed')}>{low.includes(row) ? 'Low stock' : 'In stock'}</span>], ...(admin ? [['Actions', row => editorButton(() => edit('Adjust inventory', 'inventory-records/' + row.inventoryId, stockFields, row, ['quantityOnHand', 'reorderLevel']))]] : [])]} />
      </section>}
      {page === 'Customers' && <section className="panel"><div className="toolbar">{searchInput('Search customers')}{button('Add customer', () => edit('Add customer', 'customers', customerFields))}</div>
        <Table rows={customers.filter(row => matches(name(row), row.email, row.contactNumber))} columns={[[ 'Name', name], ['Email', row => row.email || '—'], ['Contact', row => row.contactNumber || '—'], ['Actions', row => editorButton(() => edit('Edit customer', 'customers/' + row.customerId, customerFields, row))]]} />
      </section>}
      {page === 'Users' && admin && <section className="panel"><div className="toolbar">{searchInput('Search staff')}{button('Add user', () => edit('Add user', 'users', userFields))}</div>
        <Table rows={users.filter(row => matches(name(row), row.username, row.role))} columns={[[ 'Name', name], ['Username', row => row.username], ['Role', row => row.role], ['Status', row => row.accountStatus], ['Actions', row => editorButton(() => edit('Edit user', 'users/' + row.userId, [field('role', 'Role', 'text', ['Cashier', 'Admin']), field('accountStatus', 'Status', 'text', ['Active', 'Inactive'])], row))]]} />
      </section>}
      {page === 'Sales' && <section className="panel"><div className="toolbar">{searchInput('Search sale ID or status')}</div><Table rows={sales.filter(row => matches(row.saleId, row.saleStatus))} columns={salesColumns} /></section>}
      {page === 'Checkout' && <div className="checkout"><section className="panel"><div className="toolbar"><h2>Product catalog</h2>{searchInput('Search name or SKU')}</div>
        <Table rows={products.filter(row => row.productStatus === 'Available' && matches(row.productName, row.productCode))} columns={[
          ['Product', row => <><strong>{row.productName}</strong><small>{row.productCode}</small></>], ['Price', row => money(row.unitPrice)], ['Stock', row => stock.get(row.productId)?.quantityOnHand ?? 0],
          ['Add to sale', row => <form className="line" onSubmit={event => {
            event.preventDefault();
            const quantity = Number(new FormData(event.currentTarget).get('quantity'));
            perform(async () => { await api('sales/' + sale.saleId + '/items', 'POST', { productId: row.productId, quantity }); await openSale(sale.saleId); });
          }}><input name="quantity" type="number" aria-label={'Quantity for ' + row.productName} min="1" max={stock.get(row.productId)?.quantityOnHand ?? 0} defaultValue="1" required /><button className="quiet" disabled={busy || !sale || !stock.get(row.productId)?.quantityOnHand}>Add</button></form>],
        ]} empty="No matching products. Add products and stock before checkout." />
      </section><section className="panel cart"><h2>{sale ? 'Sale #' + sale.saleId : 'New sale'}</h2>
        {!sale ? <form onSubmit={event => {
          event.preventDefault();
          const customerId = Number(new FormData(event.currentTarget).get('customerId')) || null;
          perform(async () => { const newSale = await api('sales', 'POST', { customerId }); await openSale(newSale.saleId); });
        }}><label>Customer<select name="customerId"><option value="">Walk-in customer</option>{customers.map(row => <option key={row.customerId} value={row.customerId}>{name(row)}</option>)}</select></label><button className="primary" disabled={busy}>Start sale</button></form> :
        <><p className="muted">{sale.customer ? name(sale.customer) : 'Walk-in customer'}</p>
          <Table rows={sale.items || []} columns={[[ 'Item', row => row.product?.productName + ' × ' + row.quantity], ['Subtotal', row => money(row.subtotal)], ['Actions', row => <button className="quiet" disabled={busy} onClick={() => perform(async () => { await api('sales/' + sale.saleId + '/items/' + row.saleItemId, 'DELETE'); await openSale(sale.saleId); })}>Remove</button>]]} empty="Add a product from the catalog." />
          <div className="total"><span>Total</span><strong>{money(sale.totalAmount)}</strong></div>
          <form onSubmit={event => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget));
            const id = sale.saleId;
            perform(async () => {
              const payment = await api('payments', 'POST', { saleId: id, paymentMethod, amountPaid: paymentMethod === 'Cash' ? Number(values.amountPaid) : Number(sale.totalAmount), ...(values.referenceNo && { referenceNo: values.referenceNo }) });
              setSale(null); setNotice('Payment recorded. Change: ' + money(payment.changeAmount)); await openReceipt(id); await refresh();
            });
          }}><label>Payment method<select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}><option value="Cash">Cash</option><option value="Card">Card (record only)</option></select></label>
            {paymentMethod === 'Cash' ? <label>Amount received<input name="amountPaid" type="number" step=".01" min={sale.totalAmount} required /></label> : <label>Terminal reference<input name="referenceNo" maxLength="50" required /></label>}
            <button className="primary" disabled={busy || !sale.items?.length}>Record payment</button>
          </form><button className="quiet cancel" disabled={busy} onClick={() => {
            if (window.confirm('Cancel this pending sale?')) perform(async () => { await api('sales/' + sale.saleId, 'PATCH', { saleStatus: 'Cancelled' }); setSale(null); await refresh(); });
          }}>Cancel sale</button></>}
      </section></div>}
      {editor && <div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-label={editor.label}><h2>{editor.label}</h2>{alert}<form onSubmit={save}>
        <FormFields fields={editor.fields} initial={editor.initial} /><div className="dialog-actions">
          {editor.deleting && <button type="button" className="danger" disabled={busy} onClick={() => {
            if (window.confirm('Delete this record?')) perform(async () => { await api(editor.path, 'DELETE'); setEditor(null); await refresh(); });
          }}>Delete</button>}
          <button type="button" className="quiet" onClick={() => { setEditor(null); setError(''); }}>Close</button><button className="primary" disabled={busy}>Save</button>
        </div></form></section></div>}
      {(receipt || detail) && <div className="overlay"><section className="dialog printable" role="dialog" aria-modal="true" aria-label={receipt ? 'Receipt' : 'Sale details'}>
        <p className="eyebrow">AUTOPOINT</p><h2>{receipt?.receipt?.receiptNumber || 'Sale #' + (receipt?.sale || detail).saleId}</h2>
        <p>{date(receipt?.receipt?.dateIssued || (receipt?.sale || detail).saleDate)}</p>
        <Table rows={(receipt?.sale || detail).items || []} columns={[[ 'Product', row => row.product?.productName], ['Qty', row => row.quantity], ['Subtotal', row => money(row.subtotal)]]} />
        <div className="total"><span>Total</span><strong>{money((receipt?.sale || detail).totalAmount)}</strong></div>
        <div className="dialog-actions"><button className="quiet" onClick={() => { setReceipt(null); setDetail(null); }}>Close</button>{receipt?.receipt && button('Print receipt', () => window.print())}</div>
      </section></div>}
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
