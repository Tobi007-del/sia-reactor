import { demoPages, routeTo, type DemoPageId } from "../model";

export function AppNav({ currentPage }: { currentPage: DemoPageId }) {
  return (
    <nav className="demo-nav" aria-label="Demo pages">
      {demoPages.map((page) => (
        <button type="button" key={page.id} className={page.id === currentPage ? "nav-pill is-active" : "nav-pill"} onClick={() => routeTo(page.id)}>
          <span>{page.label}</span>
          <small>{page.title}</small>
        </button>
      ))}
    </nav>
  );
}
