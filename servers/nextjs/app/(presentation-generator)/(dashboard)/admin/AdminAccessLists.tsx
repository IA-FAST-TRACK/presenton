"use client";

import {
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminUser, ApiKey } from "./admin-types";
import styles from "./AdminAccessLists.module.css";

type ListStateProps = {
  total: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClearFilters: () => void;
};

type UsersListProps = ListStateProps & {
  users: AdminUser[];
  busy: boolean;
  onResetPassword: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
};

type APIKeysListProps = ListStateProps & {
  apiKeys: ApiKey[];
  users: AdminUser[];
  busy: string | null;
  tokens: Record<string, string>;
  visibleKeys: Set<string>;
  onReveal: (id: string) => void;
  onCopy: (id: string) => void;
  onRevoke: (apiKey: ApiKey) => void;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(username: string) {
  return username.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2).toUpperCase() || "?";
}

function LoadError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className={styles.loadError} role="alert">
      <AlertCircle aria-hidden="true" size={16} />
      <p>{error}</p>
      <button type="button" onClick={onRetry}>Reintentar</button>
    </div>
  );
}

function EmptyList({
  noun,
  filtered,
  onClearFilters,
}: {
  noun: "users" | "API keys";
  filtered: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className={styles.empty}>
      <h3>
        {noun === "users"
          ? filtered ? "Ningún usuario coincide con tus filtros" : "Aún no hay usuarios"
          : filtered ? "Ninguna clave API coincide con tus filtros" : "Aún no hay claves API"}
      </h3>
      <p>
        {filtered
          ? "Prueba con otra búsqueda o quita los filtros para ver todos los resultados."
          : noun === "users"
            ? "Añade un usuario para darle su propio espacio de trabajo privado en Presenton."
            : "Genera una clave para conectar un cliente de la API REST o MCP al espacio de trabajo de un usuario."}
      </p>
      {filtered && <button type="button" onClick={onClearFilters}>Quitar filtros</button>}
    </div>
  );
}

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {[0, 1, 2, 3].map((row) => (
        <tr key={row} aria-hidden="true" className={styles.skeletonRow}>
          {Array.from({ length: columns }, (_, column) => (
            <td key={column}><span className={styles.skeleton} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function UsersList({
  users,
  total,
  loading,
  error,
  busy,
  onRetry,
  onResetPassword,
  onDeleteUser,
  onClearFilters,
}: UsersListProps) {
  return (
    <div className={styles.list} aria-busy={loading}>
      {error && <LoadError error={error} onRetry={onRetry} />}
      {loading && users.length === 0 && <span className={styles.srOnly} role="status">Cargando usuarios</span>}
      <table className={`${styles.table} ${styles.usersTable}`} aria-label="Cuentas de usuario" role="table">
        <colgroup><col /><col className={styles.roleColumn} /><col className={styles.dateColumn} /><col className={styles.userActionColumn} /></colgroup>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">Usuario</th>
            <th scope="col" role="columnheader">Rol</th>
            <th scope="col" role="columnheader" className={styles.dateHeading}>Creado</th>
            <th scope="col" role="columnheader" className={styles.actionHeading}><span className={styles.srOnly}>Acciones</span></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {loading && users.length === 0 ? <SkeletonRows columns={4} /> : users.map((user) => {
            const role = user.role === "admin" ? "Administrador" : "Usuario";
            const created = formatDate(user.created_at);
            return (
              <tr key={user.id} role="row">
                <td role="cell" className={styles.identityCell}>
                  <div className={styles.identity}>
                    <span aria-hidden="true" className={styles.avatar}>{initials(user.username)}</span>
                    <div className={styles.identityText}>
                      <span className={styles.name} title={user.username}>{user.username}</span>
                      <span className={styles.mobileMeta}>{role} · Creado el {created}</span>
                    </div>
                  </div>
                </td>
                <td role="cell" className={styles.secondaryCell}>
                  <span className={user.role === "admin" ? styles.adminRole : styles.userRole}>{role}</span>
                </td>
                <td role="cell" className={`${styles.secondaryCell} ${styles.date}`}>{created}</td>
                <td role="cell" className={styles.actionsCell}>
                  {user.role === "user" ? (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className={styles.iconButton} data-admin-action-user={user.id} aria-label={`Acciones para ${user.username}`} disabled={busy}>
                          <MoreHorizontal size={18} aria-hidden="true" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className={styles.menu}>
                        <DropdownMenuItem className={styles.menuItem} onSelect={() => onResetPassword(user)}>
                          <LockKeyhole size={15} aria-hidden="true" /> Restablecer contraseña
                        </DropdownMenuItem>
                        <DropdownMenuItem className={`${styles.menuItem} ${styles.destructiveMenuItem}`} onSelect={() => onDeleteUser(user)}>
                          <Trash2 size={15} aria-hidden="true" /> Eliminar usuario
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className={styles.protected} title="Las cuentas de administrador no se pueden eliminar ni restablecer aquí">
                      <LockKeyhole size={13} aria-hidden="true" />
                      <span>Protegida</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!loading && !error && users.length === 0 && <EmptyList noun="users" filtered={total > 0} onClearFilters={onClearFilters} />}
      {!loading && users.length > 0 && <p className={styles.resultCount}>Mostrando {users.length} de {total} {total === 1 ? "usuario" : "usuarios"}</p>}
    </div>
  );
}

export function APIKeysList({
  apiKeys,
  users,
  total,
  loading,
  error,
  busy,
  tokens,
  visibleKeys,
  onRetry,
  onReveal,
  onCopy,
  onRevoke,
  onClearFilters,
}: APIKeysListProps) {
  const now = Date.now();
  return (
    <div className={styles.list} aria-busy={loading}>
      {error && <LoadError error={error} onRetry={onRetry} />}
      {loading && apiKeys.length === 0 && <span className={styles.srOnly} role="status">Cargando claves API</span>}
      <table className={`${styles.table} ${styles.keysTable}`} aria-label="Claves API" role="table">
        <colgroup><col /><col className={styles.ownerColumn} /><col className={styles.keyDateColumn} /><col className={styles.keyDateColumn} /><col className={styles.keyActionColumn} /></colgroup>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">Clave</th>
            <th scope="col" role="columnheader">Usuario</th>
            <th scope="col" role="columnheader" className={styles.dateHeading}>Caduca</th>
            <th scope="col" role="columnheader" className={styles.dateHeading}>Último uso</th>
            <th scope="col" role="columnheader" className={styles.actionHeading}><span className={styles.srOnly}>Acciones</span></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {loading && apiKeys.length === 0 ? <SkeletonRows columns={5} /> : apiKeys.map((apiKey) => {
            const visible = visibleKeys.has(apiKey.id);
            const token = tokens[apiKey.id];
            const owner = users.find((user) => user.id === apiKey.user_id)?.username ?? apiKey.user_id;
            const expired = new Date(apiKey.expires_at).getTime() <= now;
            const expires = formatDate(apiKey.expires_at);
            const lastUsed = apiKey.last_used_at ? formatDate(apiKey.last_used_at) : "Nunca usada";
            const revealing = busy === `reveal-api-key:${apiKey.id}`;
            return (
              <tr key={apiKey.id} role="row">
                <td role="cell" className={styles.identityCell}>
                  <div className={styles.identityText}>
                    <div className={styles.keyNameLine}>
                      <span className={styles.name} title={apiKey.label}>{apiKey.label}</span>
                      <span className={expired ? styles.expired : styles.active}>{expired ? "Caducada" : "Activa"}</span>
                    </div>
                    <code className={styles.token}>{visible && token ? token : `sk-presenton-••••••••${apiKey.id.slice(-4)}`}</code>
                    <span className={styles.mobileMeta}>{owner} · Caduca el {expires} · {apiKey.last_used_at ? `Último uso: ${lastUsed}` : lastUsed}</span>
                  </div>
                </td>
                <td role="cell" className={`${styles.secondaryCell} ${styles.owner}`} title={owner}>{owner}</td>
                <td role="cell" className={`${styles.secondaryCell} ${styles.date}`}>{expires}</td>
                <td role="cell" className={`${styles.secondaryCell} ${styles.date}`}>{lastUsed}</td>
                <td role="cell" className={styles.actionsCell}>
                  <div className={styles.keyActions}>
                    <button type="button" className={styles.iconButton} aria-label={`${visible ? "Ocultar" : "Mostrar"} la clave API ${apiKey.label}`} title={`${visible ? "Ocultar" : "Mostrar"} clave API`} onClick={() => onReveal(apiKey.id)} disabled={busy !== null}>
                      {revealing ? <Loader2 size={16} className={styles.spinner} aria-hidden="true" /> : visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                    <button type="button" className={styles.iconButton} aria-label={`Copiar la clave API ${apiKey.label}`} title="Copiar clave API" onClick={() => onCopy(apiKey.id)} disabled={busy !== null}>
                      <Copy size={16} aria-hidden="true" />
                    </button>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className={styles.iconButton} data-admin-action-key={apiKey.id} aria-label={`Acciones para la clave API ${apiKey.label}`} disabled={busy !== null}>
                          <MoreHorizontal size={18} aria-hidden="true" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className={styles.menu}>
                        <DropdownMenuItem className={`${styles.menuItem} ${styles.destructiveMenuItem}`} onSelect={() => onRevoke(apiKey)}>
                          <Trash2 size={15} aria-hidden="true" /> Revocar clave
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!loading && !error && apiKeys.length === 0 && <EmptyList noun="API keys" filtered={total > 0} onClearFilters={onClearFilters} />}
      {!loading && apiKeys.length > 0 && <p className={styles.resultCount}>Mostrando {apiKeys.length} de {total} {total === 1 ? "clave API" : "claves API"}</p>}
    </div>
  );
}
