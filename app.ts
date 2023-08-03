import express, { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { recreateTables, createTableIfNotExists, read, create, update, del } from './db';

const app = express();
app.use(express.json());

recreateTables()


app.post('/:collection', async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const collection = req.params.collection;
  try {
    await createTableIfNotExists(collection);
    const item = await create(collection, req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the item.' });
  }
});

app.get('/:collection/:id', async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const collection = req.params.collection;
  const id = req.params.id;
  try {
    const item = await read(collection, id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the item.' });
  }
});

app.post('/:collection/:id', async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const collection = req.params.collection;
  const id = req.params.id;
  try {
    await createTableIfNotExists(collection);
    const item = await update(collection, id, req.body);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the item.' });
  }
});

app.delete('/:collection/:id', async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const collection = req.params.collection;
  const id = req.params.id;
  try {
    await createTableIfNotExists(collection);
    const success = await del(collection, id);
    if (!success) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the item.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});