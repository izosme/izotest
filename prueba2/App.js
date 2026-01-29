import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckSquare, Square, PlusCircle, Trash2, User as UserIcon, List as ListIcon, Mail, Key } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

function App() {
    const [tasks, setTasks] = useState([]);
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [taskLoading, setTaskLoading] = useState(false);

    const [users, setUsers] = useState([]);
    const [newUsername, setNewUsername] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [userLoading, setUserLoading] = useState(false);

    const [currentView, setCurrentView] = useState('tasks'); // 'tasks' or 'users'

    const fetchTasks = async () => {
        setTaskLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setTaskLoading(false);
        }
    };

    const handleAddTask = async () => {
        if (!newTaskDescription.trim()) {
            alert('Task description cannot be empty!');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: newTaskDescription }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newTask = await response.json();
            tasks.push(newTask);
            setTasks(tasks);
            setNewTaskDescription('');
        } catch (error) {
            console.error("Failed to add task:", error);
        }
    };

    const handleToggleComplete = async (taskId, currentStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus }),
            });
            const updatedTask = await response.json();

            if (response.ok) {
                const updatedTasks = tasks.map(task =>
                    task.id === updatedTask.id ? updatedTask : task
                );
                setTasks(updatedTasks);
            } else {
                console.error("Failed to update task:", updatedTask.message || response.statusText);
            }
        } catch (error) {
            console.error("Error toggling task status:", error);
        }
    };

    const fetchUsers = async () => {
        setUserLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setUserLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUsername.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
            alert('All user fields are required!');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: newUsername,
                    email: newUserEmail,
                    password: newUserPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to create user:", errorData);
                alert(`Error creating user: ${errorData.detail?.message || 'Unknown error'}`);
                return;
            }

            const newUser = await response.json();
            setUsers(prevUsers => [...prevUsers, newUser]);
            setNewUsername('');
            setNewUserEmail('');
            setNewUserPassword('');
            fetchUsers();
        } catch (error) {
            console.error("Error creating user:", error);
            alert("An unexpected error occurred while creating user.");
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans text-gray-800">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl mb-8">
                <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-6">
                    Full-Stack Technical Test
                </h1>

                {/* View Selector */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setCurrentView('tasks')}
                        className={`px-6 py-3 rounded-md text-lg font-semibold transition duration-300 ${currentView === 'tasks' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        <ListIcon size={20} className="inline-block mr-2" />
                        Tasks
                    </button>
                    <button
                        onClick={() => setCurrentView('users')}
                        className={`px-6 py-3 rounded-md text-lg font-semibold transition duration-300 ${currentView === 'users' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        <UserIcon size={20} className="inline-block mr-2" />
                        Users
                    </button>
                </div>

                {/* --- Task Management Section --- */}
                {currentView === 'tasks' && (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
                            My Tasks
                        </h2>

                        {/* Input for adding new tasks */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <input
                                type="text"
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                placeholder="Add a new task..."
                                className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Task description input"
                            />
                            <button
                                onClick={handleAddTask}
                                className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-md flex items-center justify-center transition duration-200 ease-in-out shadow-sm hover:shadow-md"
                            >
                                <PlusCircle size={20} className="mr-2" /> Add Task
                            </button>
                        </div>

                        {/* Task List */}
                        <ul className="space-y-4">
                            {taskLoading ? (
                                <p className="text-center text-blue-500">Loading tasks...</p>
                            ) : tasks.length === 0 ? (
                                <p className="text-center text-gray-500">No tasks to display.</p>
                            ) : (
                                tasks.map((task, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200"
                                    >
                                        <button
                                            onClick={() => handleToggleComplete(task.id, task.completed)}
                                            className="mr-3 text-gray-600 hover:text-blue-500 transition duration-150 ease-in-out"
                                        >
                                            {task.completed ? (
                                                <CheckSquare size={24} aria-label="Mark task as incomplete" />
                                            ) : (
                                                <Square size={24} aria-label="Mark task as complete" />
                                            )}
                                        </button>
                                        <span
                                            className={`flex-grow text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}
                                        >
                                            {task.description}
                                        </span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}

                {/* --- User Management Section --- */}
                {currentView === 'users' && (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
                            Manage Users
                        </h2>

                        {/* Input for adding new users */}
                        <div className="flex flex-col gap-3 mb-6 p-4 border border-blue-200 rounded-md bg-blue-50">
                            <h3 className="text-xl font-semibold text-blue-700 mb-2">Create New User</h3>
                            <div>
                                <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700">Username</label>
                                <input
                                    id="newUsername"
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Enter username"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-required="true"
                                />
                            </div>
                            <div>
                                <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    id="newUserEmail"
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    placeholder="Enter email"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-required="true"
                                />
                            </div>
                            <div>
                                <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    id="newUserPassword"
                                    type="password"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-required="true"
                                />
                            </div>
                            <button
                                onClick={handleCreateUser}
                                className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-md flex items-center justify-center transition duration-200 ease-in-out shadow-sm hover:shadow-md mt-2"
                            >
                                <PlusCircle size={20} className="mr-2" /> Create User
                            </button>
                        </div>

                        {/* User List */}
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Existing Users</h3>
                        <ul className="space-y-4">
                            {userLoading ? (
                                <p className="text-center text-blue-500">Loading users...</p>
                            ) : users.length === 0 ? (
                                <p className="text-center text-gray-500">No users to display.</p>
                            ) : (
                                users.map((user, idx) => (
                                    <li
                                        key={idx}
                                        className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200"
                                    >
                                        <p><span className="font-semibold">ID:</span> {user.id}</p>
                                        <p><span className="font-semibold">Username:</span> {user.username}</p>
                                        <p><span className="font-semibold">Email:</span> {user.email}</p>
                                        <p className="text-red-600"><span className="font-semibold">Password:</span> {user.password}</p>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

// React 18 Root setup
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
