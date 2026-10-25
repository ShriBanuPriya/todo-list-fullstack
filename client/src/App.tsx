
import { useEffect, useState } from 'react';
import './App.css';

type Task = {
  _id: string;
  title: string;
  completed: boolean;
};

const API_URL = 'http://localhost:5000/api/tasks';

function App() {
  const [task, setTask] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Load tasks from MongoDB through the backend
  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error('Could not load tasks');
        }

        const data: Task[] = await response.json();
        setTasks(data);
      } catch {
        setError('Backend connection failed. Please check the server.');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  // 2. Add a new task
  async function addTask() {
    if (task.trim() === '') return;

    try {
      setError('');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: task.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not add task');
      }

      setTasks((previousTasks) => [...previousTasks, data]);
      setTask('');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not add task'
      );
    }
  }

  // 3. Complete or uncomplete a task
  async function toggleTask(id: string) {
    const item = tasks.find((task) => task._id === id);
    if (!item) return;

    try {
      setError('');

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !item.completed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not update task');
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) => (task._id === id ? data : task))
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not update task'
      );
    }
  }

  // 4. Delete a task
  async function deleteTask(id: string) {
    try {
      setError('');

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete task');
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task._id !== id)
      );

      if (editId === id) {
        cancelEdit();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not delete task'
      );
    }
  }

  function startEdit(item: Task) {
    setEditId(item._id);
    setEditTitle(item.title);
  }

  // 5. Save edited task
  async function saveEdit() {
    if (editTitle.trim() === '' || editId === null) return;

    try {
      setError('');

      const response = await fetch(`${API_URL}/${editId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not edit task');
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) => (task._id === editId ? data : task))
      );

      cancelEdit();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not edit task'
      );
    }
  }

  function cancelEdit() {
    setEditId(null);
    setEditTitle('');
  }

  return (
    <div className="app">
      <h1>My To-Do List</h1>

      {error && <p role="alert">{error}</p>}

      <div className="task-input">
        <input
          type="text"
          placeholder="Enter a task"
          value={task}
          onChange={(event) => setTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void addTask();
          }}
        />
        <button onClick={() => void addTask()}>Add Task</button>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <ul>
          {tasks.map((item) => (
            <li key={item._id}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => void toggleTask(item._id)}
              />

              {editId === item._id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />
                  <button onClick={() => void saveEdit()}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </>
              ) : (
                <>
                  <span className={item.completed ? 'completed' : ''}>
                    {item.title}
                  </span>
                  <button onClick={() => startEdit(item)}>Edit</button>
                  <button onClick={() => void deleteTask(item._id)}>
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
