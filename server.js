const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const productsRoute = require('./routes/products');
const ordersRoute = require('./routes/orders');
const adminRoute = require('./routes/admin');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/products', productsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/admin', adminRoute);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
