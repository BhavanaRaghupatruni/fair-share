import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/">
          <h1>Fair Share</h1>
        </Link>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
