const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'food_db'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});

app.use(bodyParser.json());

// GET /food
app.get('/food', (req, res) => {
  const sql = 'SELECT * FROM food';
  connection.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// GET /food?type=fast-food
app.get('/food', (req, res) => {
  const { type } = req.query;
  const sql = `SELECT * FROM food WHERE foodType = ?`;
  connection.query(sql, [type], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// GET /food?type=fast-food&maxdeliverytime=50
app.get('/food', (req, res) => {
  const { type, maxdeliverytime } = req.query;
  const sql = `SELECT * FROM food WHERE foodType = ? AND maxDeliveryTime <= ?`;
  connection.query(sql, [type, maxdeliverytime], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// GET /food/:id
app.get('/food/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM food WHERE id = ?';
  connection.query(sql, [id], (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      res.status(404).json({ error: 'Food item not found' });
    } else {
      res.json(results[0]);
    }
  });
});

// POST /food
app.post('/food', (req, res) => {
  const { foodName, foodType, maxDeliveryTime, price } = req.body;

  if (!foodName || !foodType || !maxDeliveryTime || !price) {
    res.status(400).json({ error: 'Missing required fields' });
  } else {
    const sql = 'INSERT INTO food (foodName, foodType, maxDeliveryTime, price) VALUES (?, ?, ?, ?)';
    connection.query(sql, [foodName, foodType, maxDeliveryTime, price], (err, results) => {
      if (err) throw err;
      res.json({ message: 'Food item created', id: results.insertId });
    });
  }
});

// UPDATE /food/:id
app.put('/food/:id', async (req, res) => {
    const id = req.params.id;
    const { foodName, foodType, maxDeliveryTime, price } = req.body;
  
    // validate input data
    if (!foodName || !foodType || !maxDeliveryTime || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    // update food item in database
    try {
      const result = await pool.query(
        'UPDATE foods SET food_name = $1, food_type = $2, max_delivery_time = $3, price = $4 WHERE id = $5',
        [foodName, foodType, maxDeliveryTime, price, id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Food item not found' });
      }
      res.json({ message: 'Food item updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  //delete order
  app.delete('/food/:id', async (req, res) => {
    const id = req.params.id;
  
    // delete food item from database
    try {
      const result = await pool.query('DELETE FROM foods WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Food item not found' });
      }
      res.json({ message: 'Food item deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  //Post Order
  app.post('/food/order', async (req, res) => {
    const { foodId } = req.body;
  
    // validate input data
    if (!foodId) {
      return res.status(400).json({ error: 'Missing required field: foodId' });
    }
  
    // create order in database
    try {
      const result = await pool.query(
        'INSERT INTO orders (food_id, status) VALUES ($1, $2) RETURNING id',
        [foodId, 'Placed']
      );
      const orderId = result.rows[0].id;
      res.json({ message: 'Order created successfully', orderId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  //Update Order
  app.put('/food/order/:id', async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
  
    // validate input data
    if (!status || !['Out for Delivery', 'Delivered'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
  
    // update order in database
    try {
      const result = await pool.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id',
        [status, orderId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ message: 'Order updated successfully', orderId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.put('/food/order/cancelled/:id', async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
  
    // validate input data
    if (status !== 'Cancelled') {
      return res.status(400).json({ error: 'Invalid status value' });
    }
  
    // update order in database
    try {
      const result = await pool.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id',
        [status, orderId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ message: 'Order cancelled successfully', orderId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  
  //Get Orders
  app.get('/food/orders', async (req, res) => {
    const { status } = req.query;
  
    // validate input data
    if (!['Placed', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
  
    // get orders from database
    try {
      const result = await pool.query(
        'SELECT * FROM orders WHERE status = $1',
        [status]
      );
      const orders = result.rows;
      res.json({ orders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  