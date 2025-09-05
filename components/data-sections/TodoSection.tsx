'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { TodoItem } from '@/hooks/useFirebase';
import { 
  PlusIcon, 
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  FlagIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function TodoSection() {
  const { user } = useUser();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  // Load todos from Firebase
  useEffect(() => {
    if (!user?.id) {
      setTodos([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.id)
      // orderBy('createdAt', 'desc') // Temporarily disabled until index is created
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const todosData: TodoItem[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          dueDate: doc.data().dueDate?.toDate() || null,
        })) as TodoItem[];
        
        // Client-side sorting since orderBy is temporarily disabled
        todosData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setTodos(todosData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    try {
      await addDoc(collection(db, 'todos'), {
        userId: user.id,
        title: formData.title,
        description: formData.description,
        completed: false,
        dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : null,
        priority: formData.priority,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      resetForm();
    } catch (err) {
      setError(`Failed to create todo: ${err}`);
    }
  };

  const toggleComplete = async (todoId: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'todos', todoId), {
        completed: !completed,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      setError(`Failed to update todo: ${err}`);
    }
  };

  const deleteTodo = async (todoId: string) => {
    if (confirm('Are you sure you want to delete this todo?')) {
      try {
        await deleteDoc(doc(db, 'todos', todoId));
      } catch (err) {
        setError(`Failed to delete todo: ${err}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', dueDate: '', priority: 'medium' });
    setShowForm(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDueDateStatus = (dueDate: Date | null) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600' };
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-yellow-600' };
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: 'text-blue-600' };
    return { text: dueDate.toLocaleDateString(), color: 'text-gray-600' };
  };

  const completedTodos = todos.filter(todo => todo.completed);
  const pendingTodos = todos.filter(todo => !todo.completed);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <ListBulletIcon className="h-7 w-7 mr-2 text-green-600" />
            Todo List
          </h3>
          <p className="text-gray-600">Stay organized with your tasks</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Task
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{todos.length}</div>
          <div className="text-sm text-blue-800">Total Tasks</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{pendingTodos.length}</div>
          <div className="text-sm text-yellow-800">Pending</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{completedTodos.length}</div>
          <div className="text-sm text-green-800">Completed</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <h4 className="font-medium">Error</h4>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-xl font-bold mb-4">Add New Task</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Todos List */}
      {todos.length === 0 ? (
        <div className="text-center py-12">
          <ListBulletIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No tasks yet</h4>
          <p className="text-gray-500">Add your first task to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Tasks */}
          {pendingTodos.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Pending Tasks</h4>
              <div className="space-y-3">
                {pendingTodos.map((todo) => (
                  <div key={todo.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleComplete(todo.id!, todo.completed)}
                        className="mt-1 w-5 h-5 border-2 border-gray-300 rounded hover:border-green-500 transition-colors flex items-center justify-center"
                      >
                        {todo.completed && <CheckIcon className="h-3 w-3 text-green-600" />}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium text-gray-800">{todo.title}</h5>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs border rounded-full ${getPriorityColor(todo.priority)}`}>
                              <FlagIcon className="h-3 w-3 inline mr-1" />
                              {todo.priority}
                            </span>
                            <button
                              onClick={() => deleteTodo(todo.id!)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {todo.description && (
                          <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500">
                            Created {todo.createdAt.toLocaleDateString()}
                          </div>
                          {todo.dueDate && (
                            <div className={`text-xs flex items-center ${getDueDateStatus(todo.dueDate)?.color}`}>
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {getDueDateStatus(todo.dueDate)?.text}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTodos.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Completed Tasks</h4>
              <div className="space-y-3">
                {completedTodos.map((todo) => (
                  <div key={todo.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleComplete(todo.id!, todo.completed)}
                        className="mt-1 w-5 h-5 bg-green-500 border-2 border-green-500 rounded flex items-center justify-center"
                      >
                        <CheckIcon className="h-3 w-3 text-white" />
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium text-gray-600 line-through">{todo.title}</h5>
                          <button
                            onClick={() => deleteTodo(todo.id!)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {todo.description && (
                          <p className="text-sm text-gray-500 mt-1 line-through">{todo.description}</p>
                        )}
                        
                        <div className="text-xs text-gray-400 mt-2">
                          Completed {todo.updatedAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
