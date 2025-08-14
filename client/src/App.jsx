import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const roleValues = ['user', 'manager', 'viewer', 'admin'];

// validation schemas
const userBaseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  role: z.enum(roleValues),
});
const userCreateSchema = userBaseSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
const userUpdateSchema = userBaseSchema.extend({
  password: z
    .string()
    .optional()
    .transform((v) => v ?? '')
    .refine((v) => v === '' || v.length >= 6, {
      message: 'Password must be at least 6 characters',
    }),
});

function App() {
  const [token, setToken] = useState('');
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'demo@example.com', password: 'password' },
    mode: 'onChange',
  });

  // for edit
  const [editingId, setEditingId] = useState('');

  // require password on create, optional on edit
  const createResolver = useMemo(() => zodResolver(userCreateSchema), []);
  const updateResolver = useMemo(() => zodResolver(userUpdateSchema), []);
  const userForm = useForm({
    resolver: (values, ctx, opts) =>
      (editingId ? updateResolver(values, ctx, opts) : createResolver(values, ctx, opts)),
    defaultValues: { name: '', email: '', role: 'user', password: '' },
    mode: 'onChange',
  });

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    // get auth from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('auth') || 'null');
      if (saved?.token) {
        setToken(saved.token);
        setMe(saved.user || null);
      }
    } catch {
      // localStorage corrupted
      localStorage.removeItem('auth');  
    }
  }, []);

  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && token) {
        // auto sign-out on unauthorized
        localStorage.removeItem('auth');
        setToken('');
        setMe(null);
      }
      const err = new Error(data?.error || 'Request failed');
      err.details = data?.details;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function onSubmitLogin(values) {
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/login', { method: 'POST', body: JSON.stringify(values) });
      setToken(data.token);
      setMe(data.user);
      localStorage.setItem('auth', JSON.stringify({ token: data.token, user: data.user }));
    } catch (err) {
      // field errors
      if (err.details) {
        Object.entries(err.details).forEach(([field, message]) => {
          loginForm.setError(field, { type: 'server', message: String(message) });
        });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setError('');
    try {
      await api('/api/logout', { method: 'POST' });
    } catch {
      setError('Logout request failed');
    }
    setToken('');
    setMe(null);
    setUsers([]);
    setEditingId('');
    userForm.reset({ name: '', email: '', role: 'user', password: '' });
    // reset login form
    loginForm.reset({ email: 'demo@example.com', password: 'password' });
    localStorage.removeItem('auth');
  }

  async function loadUsers() {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [isAuthenticated]);

  function startCreate() {
    setEditingId('');
    userForm.reset({ name: '', email: '', role: 'user', password: '' });
    userForm.clearErrors();
  }

  function startEdit(u) {
    setEditingId(u.id);
    userForm.reset({ name: u.name, email: u.email, role: u.role, password: '' });
    userForm.clearErrors();
  }

  async function onSubmitUser(values) {
    setLoading(true);
    setError('');
    try {
      const payload = { ...values };
      if (!payload.password) delete payload.password;

      if (editingId) {
        const updated = await api(`/api/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const created = await api('/api/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setUsers((prev) => [created, ...prev]);
      }
      startCreate();
    } catch (err) {
      if (err.status === 409) {
        userForm.setError('email', { type: 'server', message: 'Email already exists' });
      } else if (err.details) {
        Object.entries(err.details).forEach(([field, message]) => {
          userForm.setError(field, { type: 'server', message: String(message) });
        });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    setLoading(true);
    setError('');
    try {
      await api(`/api/users/${id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (editingId === id) startCreate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand">CRUD Demo</span>
          <div className="ms-auto d-flex align-items-center gap-2">
            {isAuthenticated && (
              <>
                <span className="navbar-text text-white small">
                  {me?.name} · {me?.email}
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container py-4">
        {!isAuthenticated ? (
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-5">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-3">Sign in</h5>
                  <div aria-live="polite" aria-atomic="true">
                    {error && (
                      <div className="alert alert-danger py-2" role="alert">
                        {error}
                      </div>
                    )}
                  </div>
                  <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="vstack gap-3" noValidate>
                    <div>
                      <label className="form-label">Email <span className="text-danger">*</span></label>
                      <input
                        className={`form-control ${loginForm.formState.errors.email ? 'is-invalid' : ''}`}
                        placeholder="Email"
                        autoComplete="username"
                        type="email"
                        required
                        autoFocus
                        {...loginForm.register('email')}
                      />
                      {loginForm.formState.errors.email && (
                        <div className="invalid-feedback">
                          {loginForm.formState.errors.email.message}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Password <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input
                          className={`form-control ${loginForm.formState.errors.password ? 'is-invalid' : ''}`}
                          placeholder="Password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          {...loginForm.register('password')}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label="Toggle password visibility"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                        {loginForm.formState.errors.password && (
                          <div className="invalid-feedback d-block">
                            {loginForm.formState.errors.password.message}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!loginForm.formState.isValid || loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </button>
                    {/* <div className="text-muted small">Tip: demo@example.com / password</div> */}
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-12 col-lg-5">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="card-title mb-0">{editingId ? 'Edit User' : 'Create User'}</h5>
                    {editingId && (
                      <button className="btn btn-sm btn-outline-secondary" onClick={startCreate}>Cancel</button>
                    )}
                  </div>

                  {error && (
                    <div className="alert alert-danger py-2" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="vstack gap-3" noValidate>
                    <div>
                      <label className="form-label">Name <span className="text-danger">*</span></label>
                      <input
                        className={`form-control ${userForm.formState.errors.name ? 'is-invalid' : ''}`}
                        placeholder="Name"
                        required
                        {...userForm.register('name')}
                      />
                      {userForm.formState.errors.name && (
                        <div className="invalid-feedback">
                          {userForm.formState.errors.name.message}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Email <span className="text-danger">*</span></label>
                      <input
                        className={`form-control ${userForm.formState.errors.email ? 'is-invalid' : ''}`}
                        placeholder="Email"
                        type="email"
                        required
                        {...userForm.register('email')}
                      />
                      {userForm.formState.errors.email && (
                        <div className="invalid-feedback">
                          {userForm.formState.errors.email.message}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Role <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${userForm.formState.errors.role ? 'is-invalid' : ''}`}
                        required
                        {...userForm.register('role')}
                      >
                        <option value="user">user</option>
                        <option value="manager">manager</option>
                        <option value="viewer">viewer</option>
                        <option value="admin">admin</option>
                      </select>
                      {userForm.formState.errors.role && (
                        <div className="invalid-feedback">
                          {userForm.formState.errors.role.message}
                        </div>
                      )}
                    </div>
      <div>
                      <label className="form-label">
                        {editingId ? 'New Password (optional)' : (
                          <>
                            Password <span className="text-danger">*</span>
                          </>
                        )}
                      </label>
                      <div className="input-group">
                        <input
                          className={`form-control ${userForm.formState.errors.password ? 'is-invalid' : ''}`}
                          placeholder={editingId ? 'New Password (optional)' : 'Password'}
                          type="password"
                          required={!editingId}
                          {...userForm.register('password')}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label="Toggle password visibility"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                        {userForm.formState.errors.password && (
                          <div className="invalid-feedback d-block">
                            {userForm.formState.errors.password.message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-primary" disabled={!userForm.formState.isValid || loading}>
                        {editingId ? 'Save' : 'Create'}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={startCreate} disabled={loading}>
                        Reset
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="card-title mb-0">Users</h5>
                    {/* <button onClick={loadUsers} className="btn btn-outline-primary btn-sm" disabled={loading}>
                      {loading ? 'Loading...' : 'Refresh'}
                    </button> */}
      </div>
                  <div className="table-responsive">
                    <table className="table table-striped align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th style={{ width: 170 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td><span className="badge text-bg-secondary text-uppercase">{u.role}</span></td>
                            <td>
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit(u)} disabled={loading}>
                                  Edit
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(u.id)} disabled={loading}>
                                  Delete
        </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
      </div>
        )}
      </main>
    </>
  );
}

export default App;
