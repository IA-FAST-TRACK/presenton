"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Trash2,
  UserPlus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notify } from "@/components/ui/sonner";
import { sanitizeAnalyticsError } from "@/utils/analytics";
import { formatFastApiDetail } from "@/utils/authErrors";
import { copyTextToClipboard } from "@/utils/clipboard";
import { MixpanelEvent, trackEvent } from "@/utils/mixpanel";
import { APIKeysList, UsersList } from "./AdminAccessLists";
import AdminSelectPopover from "./AdminSelectPopover";
import type { AdminUser, ApiKey } from "./admin-types";
import styles from "./AdminPanel.module.css";

type ApiKeyCreated = ApiKey & { token: string };

type AdminDialog =
  | { kind: "reset-password"; user: AdminUser }
  | { kind: "delete-user"; user: AdminUser }
  | { kind: "revoke-key"; apiKey: ApiKey }
  | null;

type AdminPanelProps = {
  embedded?: boolean;
  onBackToSettings?: () => void;
};

async function errorDetail(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null);
  return payload?.detail === undefined
    ? `La solicitud ha fallado (${response.status})`
    : formatFastApiDetail(payload.detail);
}

const primaryButtonClass =
  `${styles.primaryButton} motion-press`;

const inputClass =
  styles.input;

export default function AdminPanel({ embedded = false, onBackToSettings }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeyTokens, setApiKeyTokens] = useState<Record<string, string>>({});
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(() => new Set());
  const [apiKeyUserId, setApiKeyUserId] = useState("");
  const [apiKeyLabel, setApiKeyLabel] = useState("Cliente API");
  const [apiKeyExpiryDays, setApiKeyExpiryDays] = useState(90);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [dialog, setDialog] = useState<AdminDialog>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [keysLoading, setKeysLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [keySearch, setKeySearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [showUserForm, setShowUserForm] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const usernameInput = useRef<HTMLInputElement>(null);
  const keyLabelInput = useRef<HTMLInputElement>(null);
  const createAction = useRef<HTMLButtonElement>(null);
  const dialogReturnFocus = useRef<HTMLButtonElement | null>(null);
  const [restoreCreateFocus, setRestoreCreateFocus] = useState(false);

  const loadUsers = useCallback(async (
    trigger: "initial" | "manual" | "user_created" | "user_deleted" = "initial"
  ) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await fetch("/api/v1/admin/users", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.ok) {
        const loadedUsers = (await response.json()) as AdminUser[];
        setUsers(loadedUsers);
        setOwnerFilter((current) =>
          current === "all" || loadedUsers.some((user) => user.id === current)
            ? current
            : "all"
        );
        setApiKeyUserId((current) =>
          current && loadedUsers.some((user) => user.id === current)
            ? current
            : loadedUsers.find((user) => user.role === "admin")?.id ?? loadedUsers[0]?.id ?? ""
        );
        trackEvent(MixpanelEvent.Auth_Admin_User_List_Loaded, {
          trigger,
          user_count: loadedUsers.length,
        });
      } else {
        const detail = await errorDetail(response);
        setUsersError(`No se han podido cargar los usuarios. ${detail}`);
        trackEvent(MixpanelEvent.Auth_Admin_User_List_Failed, {
          trigger,
          status_code: response.status,
          error_message: sanitizeAnalyticsError(detail),
        });
        notify.error("No se han podido cargar los usuarios", detail);
      }
    } catch (loadError) {
      setUsersError("No se han podido cargar los usuarios. Comprueba tu conexión e inténtalo de nuevo.");
      trackEvent(MixpanelEvent.Auth_Admin_User_List_Failed, {
        trigger,
        status_code: null,
        error_message: sanitizeAnalyticsError(
          loadError,
          "Could not load users"
        ),
      });
      notify.error("No se han podido cargar los usuarios", "Inténtalo de nuevo.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadApiKeys = useCallback(async () => {
    setKeysLoading(true);
    setKeysError(null);
    try {
      const response = await fetch("/api/v1/admin/api-keys", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.ok) {
        const loaded = (await response.json()) as ApiKey[];
        const active = loaded.filter((apiKey) => !apiKey.revoked_at);
        setApiKeys(active);
        const validIds = new Set(active.map((key) => key.id));
        setApiKeyTokens((current) => Object.fromEntries(
          Object.entries(current).filter(([id]) => validIds.has(id))
        ));
        setVisibleApiKeys((current) => new Set(
          [...current].filter((id) => validIds.has(id))
        ));
        trackEvent(MixpanelEvent.Auth_Admin_API_Key_List_Loaded, {
          api_key_count: active.length,
        });
      } else {
        const detail = await errorDetail(response);
        setKeysError(`No se han podido cargar las claves API. ${detail}`);
        notify.error("No se han podido cargar las claves API", detail);
      }
    } catch {
      setKeysError("No se han podido cargar las claves API. Comprueba tu conexión e inténtalo de nuevo.");
      notify.error("No se han podido cargar las claves API", "Inténtalo de nuevo.");
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent(MixpanelEvent.Auth_Admin_Viewed, {
      embedded,
    });
    void Promise.all([loadUsers(), loadApiKeys()]);
  }, [embedded, loadApiKeys, loadUsers]);

  useEffect(() => {
    if (showUserForm && activeTab === "users") usernameInput.current?.focus();
    if (showKeyForm && activeTab === "keys") keyLabelInput.current?.focus();
  }, [showUserForm, showKeyForm, activeTab]);

  useEffect(() => {
    if (restoreCreateFocus && busy === null) {
      createAction.current?.focus({ preventScroll: true });
      setRestoreCreateFocus(false);
    }
  }, [restoreCreateFocus, busy]);

  const addUser = async (event: FormEvent) => {
    event.preventDefault();
    const cleanedUsername = username.trim();
    setBusy("add");
    trackEvent(MixpanelEvent.Auth_Admin_User_Create_Started, {
      username_length: cleanedUsername.length,
      user_count_before: users.length,
    });
    try {
      const response = await fetch("/api/v1/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanedUsername, password }),
      });
      if (response.ok) {
        trackEvent(MixpanelEvent.Auth_Admin_User_Create_Completed, {
          username_length: cleanedUsername.length,
          user_count_after: users.length + 1,
        });
        notify.success("Usuario creado", `${cleanedUsername} ya puede iniciar sesión.`);
        setUsername("");
        setPassword("");
        setShowPassword(false);
        setShowUserForm(false);
        setRestoreCreateFocus(true);
        setUserSearch("");
        setRoleFilter("all");
        await loadUsers("user_created");
      } else {
        const detail = await errorDetail(response);
        trackEvent(MixpanelEvent.Auth_Admin_User_Create_Failed, {
          status_code: response.status,
          error_message: sanitizeAnalyticsError(detail),
        });
        notify.error("No se ha podido crear el usuario", detail);
      }
    } catch (createError) {
      trackEvent(MixpanelEvent.Auth_Admin_User_Create_Failed, {
        status_code: null,
        error_message: sanitizeAnalyticsError(
          createError,
          "Could not create user"
        ),
      });
      notify.error("No se ha podido crear el usuario", "Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  };

  const openAdminDialog = (next: Exclude<AdminDialog, null>) => {
    const kind = next.kind === "revoke-key" ? "key" : "user";
    const id = next.kind === "revoke-key" ? next.apiKey.id : next.user.id;
    dialogReturnFocus.current = document.querySelector<HTMLButtonElement>(
      `button[data-admin-action-${kind}="${CSS.escape(id)}"]`
    );
    setDialog(next);
  };

  const openResetPassword = (user: AdminUser) => {
    setResetPasswordValue("");
    openAdminDialog({ kind: "reset-password", user });
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (dialog?.kind !== "reset-password") return;

    const { user } = dialog;
    setBusy(`reset:${user.id}`);
    trackEvent(MixpanelEvent.Auth_Admin_User_Password_Reset_Started, {
      target_role: user.role,
    });
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswordValue }),
      });
      if (response.ok) {
        trackEvent(MixpanelEvent.Auth_Admin_User_Password_Reset_Completed, {
          target_role: user.role,
          sessions_invalidated: true,
        });
        notify.success("Contraseña restablecida", "Se han cerrado las sesiones existentes.");
        setDialog(null);
        setResetPasswordValue("");
      } else {
        const detail = await errorDetail(response);
        trackEvent(MixpanelEvent.Auth_Admin_User_Password_Reset_Failed, {
          target_role: user.role,
          status_code: response.status,
          error_message: sanitizeAnalyticsError(detail),
        });
        notify.error("No se ha podido restablecer la contraseña", detail);
      }
    } catch (resetError) {
      trackEvent(MixpanelEvent.Auth_Admin_User_Password_Reset_Failed, {
        target_role: user.role,
        status_code: null,
        error_message: sanitizeAnalyticsError(
          resetError,
          "Could not reset password"
        ),
      });
      notify.error("No se ha podido restablecer la contraseña", "Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  };

  const deleteUser = async () => {
    if (dialog?.kind !== "delete-user") return;

    const { user } = dialog;
    setBusy(`delete:${user.id}`);
    trackEvent(MixpanelEvent.Auth_Admin_User_Delete_Started, {
      target_role: user.role,
      user_count_before: users.length,
    });
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        trackEvent(MixpanelEvent.Auth_Admin_User_Delete_Completed, {
          target_role: user.role,
          user_count_after: Math.max(0, users.length - 1),
        });
        notify.success("Usuario eliminado", `Se ha eliminado el espacio de trabajo de ${user.username}.`);
        await loadUsers("user_deleted");
        await loadApiKeys();
        setDialog(null);
      } else {
        const detail = await errorDetail(response);
        trackEvent(MixpanelEvent.Auth_Admin_User_Delete_Failed, {
          target_role: user.role,
          status_code: response.status,
          error_message: sanitizeAnalyticsError(detail),
        });
        notify.error("No se ha podido eliminar el usuario", detail);
      }
    } catch (deleteError) {
      trackEvent(MixpanelEvent.Auth_Admin_User_Delete_Failed, {
        target_role: user.role,
        status_code: null,
        error_message: sanitizeAnalyticsError(
          deleteError,
          "Could not delete user"
        ),
      });
      notify.error("No se ha podido eliminar el usuario", "Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  };

  const createApiKey = async (event: FormEvent) => {
    event.preventDefault();
    if (usersLoading || busy === "create-api-key") return;
    if (!users.some((user) => user.id === apiKeyUserId)) {
      notify.error("Elige un usuario", "Selecciona el usuario a cuyo espacio de trabajo accederá esta clave.");
      document.getElementById("admin-key-user")?.focus();
      return;
    }
    if (!apiKeyLabel.trim()) {
      notify.error("Añade una etiqueta a la clave", "Ponle un nombre a esta clave para identificar su cliente.");
      keyLabelInput.current?.focus();
      return;
    }
    setBusy("create-api-key");
    trackEvent(MixpanelEvent.Auth_Admin_API_Key_Create_Started, {
      api_key_count_before: apiKeys.length,
    });
    try {
      const response = await fetch("/api/v1/admin/api-keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: apiKeyUserId,
          label: apiKeyLabel.trim(),
          expiry_days: apiKeyExpiryDays,
        }),
      });
      if (!response.ok) {
        notify.error("No se ha podido crear la clave API", await errorDetail(response));
        return;
      }
      const created = (await response.json()) as ApiKeyCreated;
      const { token, ...apiKey } = created;
      setApiKeys((current) => [apiKey, ...current]);
      setApiKeyTokens((current) => ({ ...current, [apiKey.id]: token }));
      setVisibleApiKeys((current) => new Set(current).add(apiKey.id));
      setShowKeyForm(false);
      setRestoreCreateFocus(true);
      setKeySearch("");
      setOwnerFilter("all");
      trackEvent(MixpanelEvent.Auth_Admin_API_Key_Create_Completed, {
        api_key_count_after: apiKeys.length + 1,
      });
      try {
        await copyTextToClipboard(token);
        notify.success("Clave API creada", "La clave está visible y se ha copiado al portapapeles.");
      } catch {
        notify.success("Clave API creada", "La clave está visible más abajo.");
      }
    } catch {
      notify.error("No se ha podido crear la clave API", "Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  };

  const getApiKeyToken = async (apiKeyId: string) => {
    const cached = apiKeyTokens[apiKeyId];
    if (cached) return cached;
    const response = await fetch(
      `/api/v1/admin/api-keys/${apiKeyId}/token`,
      { cache: "no-store", credentials: "include" }
    );
    if (!response.ok) throw new Error(await errorDetail(response));
    const payload = (await response.json()) as { token: string };
    setApiKeyTokens((current) => ({ ...current, [apiKeyId]: payload.token }));
    return payload.token;
  };

  const toggleApiKeyVisibility = async (apiKeyId: string) => {
    if (visibleApiKeys.has(apiKeyId)) {
      setVisibleApiKeys((current) => {
        const next = new Set(current);
        next.delete(apiKeyId);
        return next;
      });
      return;
    }
    setBusy(`reveal-api-key:${apiKeyId}`);
    try {
      await getApiKeyToken(apiKeyId);
      setVisibleApiKeys((current) => new Set(current).add(apiKeyId));
    } catch (revealError) {
      notify.error(
        "No se ha podido mostrar la clave API",
        revealError instanceof Error ? revealError.message : "Inténtalo de nuevo."
      );
    } finally {
      setBusy(null);
    }
  };

  const copyApiKey = async (apiKeyId: string) => {
    setBusy(`reveal-api-key:${apiKeyId}`);
    try {
      await copyTextToClipboard(await getApiKeyToken(apiKeyId));
      notify.success("Clave API copiada");
    } catch (copyError) {
      notify.error(
        "No se ha podido copiar la clave API",
        copyError instanceof Error ? copyError.message : "Inténtalo de nuevo."
      );
    } finally {
      setBusy(null);
    }
  };

  const revokeApiKey = async () => {
    if (dialog?.kind !== "revoke-key") return;
    const { apiKey } = dialog;
    setBusy(`revoke-api-key:${apiKey.id}`);
    trackEvent(MixpanelEvent.Auth_Admin_API_Key_Revoke_Started, {
      api_key_count_before: apiKeys.length,
    });
    try {
      const response = await fetch(
        `/api/v1/admin/api-keys/${apiKey.id}/revoke`,
        { method: "POST", credentials: "include" }
      );
      if (!response.ok) {
        notify.error("No se ha podido revocar la clave API", await errorDetail(response));
        return;
      }
      const revoked = (await response.json()) as ApiKey;
      setApiKeys((current) =>
        current.filter((item) => item.id !== revoked.id)
      );
      setApiKeyTokens((current) => {
        const next = { ...current };
        delete next[apiKey.id];
        return next;
      });
      setVisibleApiKeys((current) => {
        const next = new Set(current);
        next.delete(apiKey.id);
        return next;
      });
      trackEvent(MixpanelEvent.Auth_Admin_API_Key_Revoke_Completed, {
        api_key_count_after: Math.max(0, apiKeys.length - 1),
      });
      setDialog(null);
      notify.success("Clave API revocada");
    } catch {
      notify.error("No se ha podido revocar la clave API", "Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  };

  const dialogBusy =
    (dialog?.kind === "reset-password" && busy === `reset:${dialog.user.id}`) ||
    (dialog?.kind === "delete-user" && busy === `delete:${dialog.user.id}`) ||
    (dialog?.kind === "revoke-key" && busy === `revoke-api-key:${dialog.apiKey.id}`);
  const RootElement = embedded ? "section" : "main";
  const formOpen = activeTab === "users" ? showUserForm : showKeyForm;
  const userQuery = userSearch.trim().toLocaleLowerCase();
  const keyQuery = keySearch.trim().toLocaleLowerCase();
  const filteredUsers = users.filter((user) =>
    user.username.toLocaleLowerCase().includes(userQuery) &&
    (roleFilter === "all" || user.role === roleFilter)
  );
  const filteredKeys = apiKeys.filter((key) => {
    const owner = users.find((user) => user.id === key.user_id)?.username ?? key.user_id;
    return `${key.label} ${owner}`.toLocaleLowerCase().includes(keyQuery) &&
      (ownerFilter === "all" || key.user_id === ownerFilter);
  });
  const userCount = usersLoading || usersError ? "—" : users.length;
  const keyCount = keysLoading || keysError ? "—" : apiKeys.length;
  const clearUserFilters = () => { setUserSearch(""); setRoleFilter("all"); };
  const clearKeyFilters = () => { setKeySearch(""); setOwnerFilter("all"); };

  return (
    <RootElement className={`${styles.root} ${embedded ? styles.embedded : styles.standalone}`}>
      <div className={styles.canvas}>
        {embedded && onBackToSettings && (
          <button type="button" className={styles.backButton} onClick={onBackToSettings}>
            <ArrowLeft size={15} aria-hidden="true" /> Volver a ajustes
          </button>
        )}
        <header className={styles.header}>
          <div>
            <h1 className={styles.heading}>Administración</h1>
            <p className={styles.description}>Gestiona quién puede iniciar sesión y qué clientes pueden conectarse a Fast Track Presentaciones.</p>
          </div>
          <button
            ref={createAction}
            type="button"
            className={formOpen ? styles.secondaryButton : primaryButtonClass}
            disabled={busy !== null}
            aria-expanded={activeTab === "users" ? showUserForm : showKeyForm}
            aria-controls={activeTab === "users" ? "admin-create-user" : "admin-create-key"}
            onClick={() => activeTab === "users" ? setShowUserForm((open) => !open) : setShowKeyForm((open) => !open)}
          >
            {formOpen ? <X size={16} aria-hidden="true" /> : activeTab === "users" ? <UserPlus size={16} aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />}
            {formOpen ? "Cancelar" : activeTab === "users" ? "Añadir usuario" : "Generar clave API"}
          </button>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.sheet}>
          <TabsList aria-label="Vistas de administración" className={styles.tabList}>
            <TabsTrigger value="users" className={styles.tabTrigger}>
              Usuarios <span aria-hidden="true" className={styles.tabCount}>{userCount}</span>
            </TabsTrigger>
            <TabsTrigger value="keys" className={styles.tabTrigger}>
              Claves API <span aria-hidden="true" className={styles.tabCount}>{keyCount}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className={styles.tabContent}>
            {showUserForm && (
              <section id="admin-create-user" className={`${styles.createSection} motion-fade`} aria-labelledby="admin-create-user-title">
                <div className={styles.createHeading}>
                  <div>
                    <h3 id="admin-create-user-title">Añadir un usuario</h3>
                    <p>Crea credenciales de inicio de sesión para un espacio de trabajo privado.</p>
                  </div>
                  <button type="button" className={styles.iconButton} aria-label="Cerrar el formulario para añadir usuario" disabled={busy === "add"} onClick={() => { setShowUserForm(false); createAction.current?.focus(); }}><X size={16} aria-hidden="true" /></button>
                </div>
                <form onSubmit={addUser} className={styles.userForm}>
                  <div className={styles.field}>
                    <label htmlFor="admin-new-username">Nombre de usuario</label>
                    <input ref={usernameInput} id="admin-new-username" className={inputClass} placeholder="p. ej., maya.chen" minLength={3} maxLength={128} pattern={"\\S+"} title="El nombre de usuario no puede contener espacios" value={username} onChange={(event) => setUsername(event.target.value.replace(/\s/g, ""))} required spellCheck={false} autoComplete="off" disabled={busy === "add"} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="admin-new-password">Contraseña</label>
                    <div className={styles.passwordField}>
                      <input id="admin-new-password" className={inputClass} type={showPassword ? "text" : "password"} placeholder="Al menos 8 caracteres" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required disabled={busy === "add"} />
                      <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword((show) => !show)}>{showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button>
                    </div>
                  </div>
                  <button type="submit" className={primaryButtonClass} disabled={busy === "add"}>
                    {busy === "add" && <Loader2 className={styles.spinner} size={16} aria-hidden="true" />}
                    {busy === "add" ? "Creando…" : "Crear usuario"}
                  </button>
                </form>
                <p className={styles.formHint}>Las cuentas nuevas se crean con el rol de usuario. Los nombres de usuario no pueden contener espacios.</p>
              </section>
            )}
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <div className={styles.search}>
                  <Search size={16} aria-hidden="true" />
                  <input type="search" className={inputClass} aria-label="Buscar usuarios" placeholder="Buscar usuarios…" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
                </div>
                <AdminSelectPopover
                  label="Filtrar usuarios por rol"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={[
                    { value: "all", label: "Todos los roles" },
                    { value: "admin", label: "Administradores" },
                    { value: "user", label: "Usuarios" },
                  ]}
                />
              </div>
              <button type="button" className={styles.iconButton} aria-label="Actualizar cuentas" title="Actualizar cuentas" disabled={usersLoading || busy !== null} onClick={() => void loadUsers("manual")}>
                <RefreshCw size={16} aria-hidden="true" className={usersLoading ? styles.spinner : styles.refreshIcon} />
              </button>
            </div>
            <UsersList users={filteredUsers} total={users.length} loading={usersLoading} error={usersError} busy={busy !== null} onRetry={() => void loadUsers("manual")} onResetPassword={openResetPassword} onDeleteUser={(user) => openAdminDialog({ kind: "delete-user", user })} onClearFilters={clearUserFilters} />
          </TabsContent>

          <TabsContent value="keys" className={styles.tabContent}>
            {showKeyForm && (
              <section id="admin-create-key" className={`${styles.createSection} motion-fade`} aria-labelledby="admin-create-key-title">
                <div className={styles.createHeading}>
                  <div>
                    <h3 id="admin-create-key-title">Generar una clave API</h3>
                    <p>Conecta clientes de la API REST y MCP al espacio de trabajo del usuario seleccionado.</p>
                  </div>
                  <button type="button" className={styles.iconButton} aria-label="Cerrar el formulario de clave API" disabled={busy === "create-api-key"} onClick={() => { setShowKeyForm(false); createAction.current?.focus(); }}><X size={16} aria-hidden="true" /></button>
                </div>
                <form onSubmit={createApiKey} className={styles.keyForm}>
                  <div className={styles.field}>
                    <label htmlFor="admin-key-user">Usuario</label>
                    <AdminSelectPopover
                      id="admin-key-user"
                      label="Usuario de la clave API"
                      value={apiKeyUserId}
                      onChange={setApiKeyUserId}
                      options={users.map((user) => ({ value: user.id, label: `${user.username} (${user.role === "admin" ? "administrador" : "usuario"})` }))}
                      placeholder={usersLoading ? "Cargando usuarios…" : "Selecciona un usuario"}
                      searchable
                      searchLabel="Buscar un usuario"
                      emptyMessage="No se han encontrado usuarios."
                      fullWidth
                      required
                      disabled={usersLoading || busy === "create-api-key"}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="admin-key-label">Etiqueta de la clave</label>
                    <input ref={keyLabelInput} id="admin-key-label" aria-label="Etiqueta de la clave API" className={inputClass} value={apiKeyLabel} onChange={(event) => setApiKeyLabel(event.target.value)} minLength={1} maxLength={120} placeholder="p. ej., MCP editorial" required disabled={busy === "create-api-key"} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="admin-key-expiry">Caduca tras</label>
                    <AdminSelectPopover
                      id="admin-key-expiry"
                      label="Días hasta la caducidad de la clave API"
                      value={String(apiKeyExpiryDays)}
                      onChange={(value) => setApiKeyExpiryDays(Number(value))}
                      options={[30, 90, 180, 365].map((days) => ({ value: String(days), label: `${days} días` }))}
                      fullWidth
                      required
                      disabled={busy === "create-api-key"}
                    />
                  </div>
                  <button type="submit" className={primaryButtonClass} disabled={busy === "create-api-key" || usersLoading || !apiKeyUserId || !apiKeyLabel.trim()}>
                    {busy === "create-api-key" && <Loader2 className={styles.spinner} size={16} aria-hidden="true" />}
                    {busy === "create-api-key" ? "Generando…" : "Generar clave"}
                  </button>
                </form>
                <p className={styles.formHint}>{users.length === 0 ? "Añade un usuario antes de generar una clave." : "Puedes volver a mostrar o copiar una clave más adelante. Si la revocas, sus clientes se desconectarán de inmediato."}</p>
              </section>
            )}
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <div className={styles.search}>
                  <Search size={16} aria-hidden="true" />
                  <input type="search" className={inputClass} aria-label="Buscar claves API" placeholder="Buscar claves o usuarios…" value={keySearch} onChange={(event) => setKeySearch(event.target.value)} />
                </div>
                <AdminSelectPopover
                  label="Filtrar claves API por usuario"
                  value={ownerFilter}
                  onChange={setOwnerFilter}
                  searchable
                  searchLabel="Buscar un usuario"
                  emptyMessage="No se han encontrado usuarios."
                  options={[
                    { value: "all", label: "Todos los usuarios" },
                    ...users.map((user) => ({ value: user.id, label: user.username })),
                  ]}
                />
              </div>
              <button type="button" className={styles.iconButton} aria-label="Actualizar claves API" title="Actualizar claves API" disabled={keysLoading || busy !== null} onClick={() => void loadApiKeys()}>
                <RefreshCw size={16} aria-hidden="true" className={keysLoading ? styles.spinner : styles.refreshIcon} />
              </button>
            </div>
            <APIKeysList apiKeys={filteredKeys} users={users} total={apiKeys.length} loading={keysLoading} error={keysError} busy={busy} tokens={apiKeyTokens} visibleKeys={visibleApiKeys} onRetry={() => void loadApiKeys()} onReveal={(id) => void toggleApiKeyVisibility(id)} onCopy={(id) => void copyApiKey(id)} onRevoke={(apiKey) => openAdminDialog({ kind: "revoke-key", apiKey })} onClearFilters={clearKeyFilters} />
          </TabsContent>
        </Tabs>
        <p className={styles.scopeNote}><ShieldCheck size={15} aria-hidden="true" />Los espacios de trabajo de los usuarios son privados. Las claves de API y MCP usan el acceso del usuario seleccionado.</p>
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !dialogBusy) {
            setDialog(null);
            setResetPasswordValue("");
          }
        }}
      >
        <DialogContent hideDefaultClose onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = dialogReturnFocus.current;
          (target?.isConnected ? target : createAction.current)?.focus();
        }} className={`${styles.dialog} w-[calc(100vw-32px)] max-w-[440px] gap-0 rounded-2xl border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]`}>
          {dialog?.kind === "reset-password" && (
            <form onSubmit={resetPassword}>
              <DialogHeader className="px-7 pb-5 pt-7 text-left">
                <LockKeyhole aria-hidden="true" className="mb-3 h-6 w-6 text-[#656570]" />
                <DialogTitle className="text-xl font-semibold leading-7 text-[#101323]">
                  Restablecer contraseña
                </DialogTitle>
                <DialogDescription className="pt-1 text-sm leading-6 text-[#667085]">
                  Establece una nueva contraseña para{" "}
                  <span className="font-semibold text-[#344054]">{dialog.user.username}</span>.
                  Se cerrarán las sesiones existentes.
                </DialogDescription>
                <label className="pt-4 text-xs font-semibold text-[#344054]" htmlFor="reset-password">
                  Nueva contraseña
                </label>
                <input
                  id="reset-password"
                  autoFocus
                  className={inputClass}
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  maxLength={128}
                  value={resetPasswordValue}
                  onChange={(event) => setResetPasswordValue(event.target.value)}
                  required
                />
              </DialogHeader>
              <DialogFooter className="flex-row gap-3 border-t border-[#EAECF0] p-5 sm:justify-end sm:space-x-0">
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setDialog(null)}
                  disabled={dialogBusy}
                >
                  Cancelar
                </button>
                <button type="submit" className={primaryButtonClass} disabled={dialogBusy}>
                  {dialogBusy && <Loader2 className={`${styles.spinner} h-4 w-4`} aria-hidden="true" />}
                  Restablecer contraseña
                </button>
              </DialogFooter>
            </form>
          )}

          {dialog?.kind === "delete-user" && (
            <>
              <DialogHeader className="px-7 pb-6 pt-7 text-left">
                <AlertTriangle aria-hidden="true" className="mb-3 h-6 w-6 text-[#B42318]" />
                <DialogTitle className="text-xl font-semibold leading-7 text-[#101323]">
                  ¿Eliminar a {dialog.user.username}?
                </DialogTitle>
                <DialogDescription className="pt-1 text-sm leading-6 text-[#667085]">
                  Se eliminarán de forma permanente el usuario y todas sus presentaciones,
                  plantillas, chats, tareas y archivos. Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-row gap-3 border-t border-[#EAECF0] p-5 sm:justify-end sm:space-x-0">
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setDialog(null)}
                  disabled={dialogBusy}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`${styles.primaryButton} ${styles.dangerButton}`}
                  onClick={() => void deleteUser()}
                  disabled={dialogBusy}
                >
                  {dialogBusy ? <Loader2 className={`${styles.spinner} h-4 w-4`} aria-hidden="true" /> : <Trash2 className="h-4 w-4" />}
                  Eliminar usuario
                </button>
              </DialogFooter>
            </>
          )}

          {dialog?.kind === "revoke-key" && (
            <>
              <DialogHeader className="px-7 pb-6 pt-7 text-left">
                <AlertTriangle aria-hidden="true" className="mb-3 h-6 w-6 text-[#B42318]" />
                <DialogTitle className="text-xl font-semibold leading-7 text-[#101323]">
                  ¿Revocar la clave API?
                </DialogTitle>
                <DialogDescription className="pt-1 text-sm leading-6 text-[#667085]">
                  Los clientes que usen «{dialog.apiKey.label}» perderán de inmediato el acceso
                  a la API REST y a MCP. Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-row gap-3 border-t border-[#EAECF0] p-5 sm:justify-end sm:space-x-0">
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setDialog(null)}
                  disabled={dialogBusy}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`${styles.primaryButton} ${styles.dangerButton}`}
                  onClick={() => void revokeApiKey()}
                  disabled={dialogBusy}
                >
                  {dialogBusy ? <Loader2 className={`${styles.spinner} h-4 w-4`} aria-hidden="true" /> : <Trash2 className="h-4 w-4" />}
                  Revocar clave
                </button>
              </DialogFooter>
            </>
          )}

        </DialogContent>
      </Dialog>
    </RootElement>
  );
}
