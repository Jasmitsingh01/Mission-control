import { Request, Response } from 'express';
import Todo from '../models/Todo'; // Assuming Todo model will be created next

// Get all todos
export const getTodos = async (req: Request, res: Response) => {
  try {
    const todos = await Todo.find();
    res.status(200).json(todos);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new todo
export const createTodo = async (req: Request, res: Response) => {
  const todo = new Todo({
    text: req.body.text,
    completed: req.body.completed || false,
  });
  try {
    const newTodo = await todo.save();
    res.status(201).json(newTodo);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Update a todo
export const updateTodo = async (req: Request, res: Response) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTodo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.status(200).json(updatedTodo);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a todo
export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
    if (!deletedTodo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.status(200).json({ message: 'Todo deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};