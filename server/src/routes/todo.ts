import { Router } from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../controllers/todoController';

const router = Router();

// GET /api/todos
router.get('/', getTodos);

// POST /api/todos
router.post('/', createTodo);

// PUT /api/todos/:id
router.put('/:id', updateTodo);

// DELETE /api/todos/:id
router.delete('/:id', deleteTodo);

export default router;