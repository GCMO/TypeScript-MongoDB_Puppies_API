const express = require('express');

const app = express();

const presidents = [
  {
    id: '43',
    from: '2001',
    to: '2009',
    name: 'George W. Bush',
  },
  {
    id: '44',
    from: '2009',
    to: '2017',
    name: 'Barack Obama',
  },
  {
    id: '45', from: '2017', to: '2021', name: 'Donald Trump',
  },
  { id: '46', from: '2021', name: 'Joe Biden' },
];
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// You don't need to understand how this code works for now
// just use nextId(presidents) to get the next id when adding a president

const nextId = presidentsArray => {
  // eslint-disable-next-line max-len
  const highestId = presidentsArray.reduce(
    (accumulator, currentValue) => (currentValue.id > accumulator ? currentValue.id : accumulator),
    0,
  );
  return Number.parseInt(highestId, 10) + 1;
};

app.get('/api/presidents', (req, res) => {
  try {
    res.json(presidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/presidents/:id', async (req, res) => {
  try {
    const sentData = await presidents.find(p => p.id === req.params.id);
    if (sentData) {
      return res.json(sentData);
    }
    return res.status(404).json({ error: 'President not found, check your query params' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/presidents/', async (req, res) => {
  try {
    const sentData = req.body;
    await res.header('location', '/api/presidents/');
    if (!sentData.name) {
      return res.status(400).json();
    }
    sentData.id = nextId(presidents);
    presidents.push(sentData);
    return res.status(201).json(sentData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/presidents/:id', async (req, res) => {
  const sentData = req.body;
  if (!sentData.name) {
    res.status(400).json();
    return;
  }
  const president = await presidents.find(p => p.id === req.params.id);
  president.from = sentData.from;
  president.to = sentData.to;
  president.name = sentData.name;
  res.json(president);
});

app.delete('/api/presidents/:id', (req, res) => {
  const presidentIndex = presidents.findIndex(president => president.id === req.params.id);
  if (presidentIndex === -1) {
    res.sendStatus(404);
    return;
  }
  presidents.splice(presidentIndex, 1);
  res.sendStatus(204);
});

// Don't change the code below this line
module.exports.app = app;
module.exports.db = () => presidents;
module.exports.nextId = () => nextId(presidents);

// See http://www.marcusoft.net/2015/10/eaddrinuse-when-watching-tests-with-mocha-and-supertest.html
if (!module.parent) {
  app.listen(3000, () => console.log('Server running on 3000'));
}
