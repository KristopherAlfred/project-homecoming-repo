/**
 * React Router DOM compatibility shim for the TanStack Router migration.
 *
 * The old PlayersOS project was written for react-router-dom. Rather than
 * rewriting every call site, this module exposes a react-router-dom-like API
 * built on top of @tanstack/react-router so the existing page and component
 * code keeps working with minimal changes.
 */
import {
  Link as TanStackLink,
  Navigate as TanStackNavigate,
  Outlet,
  useLocation,
  useMatch,
  useNavigate as useTanStackNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import type { LinkOptions } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

export { Outlet, useLocation, useMatch, useParams };

export function useNavigate() {
  const navigate = useTanStackNavigate();

  return useCallback(
    (
      to:
        | string
        | number
        | { to?: string; pathname?: string; search?: Record<string, unknown> | string },
      options?: { replace?: boolean; state?: unknown; relative?: "path" | "route" },
    ) => {
      if (typeof to === "number") {
        return navigate({ to: String(to) } as LinkOptions);
      }

      if (typeof to === "string") {
        return navigate({
          to,
          replace: options?.replace,
          state: options?.state,
        } as LinkOptions);
      }

      const target = to.to ?? to.pathname ?? "/";
      return navigate({
        to: target,
        search: to.search,
        replace: options?.replace,
        state: options?.state,
      } as LinkOptions);
    },
    [navigate],
  );
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const search = useSearch({ strict: false });
  const navigate = useTanStackNavigate();

  const params = useMemo(() => {
    const record: Record<string, string> = {};
    for (const [key, value] of Object.entries(search ?? {})) {
      record[key] = String(value ?? "");
    }
    return new URLSearchParams(record);
  }, [search]);

  const setSearchParams = useCallback(
    (next: URLSearchParams | Record<string, string>) => {
      const record: Record<string, string> =
        next instanceof URLSearchParams ? Object.fromEntries(next.entries()) : next;
      navigate({ to: ".", search: record, replace: true } as LinkOptions);
    },
    [navigate],
  );

  return [params, setSearchParams];
}

type NavLinkProps = {
  to: string;
  end?: boolean;
  onClick?: () => void;
  className?: string | ((state: { isActive: boolean }) => string);
  children: React.ReactNode;
  [key: string]: unknown;
};

export function NavLink({ to, end, onClick, className, children, ...rest }: NavLinkProps) {
  const match = useMatch({ from: to, shouldThrow: false });
  const { pathname } = useLocation();
  const isActive = end ? pathname === to : pathname.startsWith(to);

  const resolvedClassName =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <TanStackLink
      to={to}
      onClick={onClick}
      className={resolvedClassName}
      {...rest}
    >
      {children}
    </TanStackLink>
  );
}

export function Link({
  to,
  children,
  ...rest
}: {
  to: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <TanStackLink to={to} {...rest}>
      {children}
    </TanStackLink>
  );
}

export function Navigate({
  to,
  replace,
}: {
  to: string;
  replace?: boolean;
}) {
  return <TanStackNavigate to={to} replace={replace} />;
}
