"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { applyAutoRulesToAll } from "@/utils/autoRules";

type Collection = {
  id: string;
  name: string;
  icon: string | null;
};

type Rule = {
  id: string;
  name: string;
  match_type: string;
  match_value: string;
  collection_id: string | null;
  is_active: boolean;
};

type AutoRulesPanelProps = {
  userId: string;
};

export function AutoRulesPanel({ userId }: AutoRulesPanelProps) {
  const supabase = createClient();
  const [rules, setRules] = useState<Rule[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  // Estados para crear nueva regla
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleType, setNewRuleType] = useState<"domain" | "keyword">("domain");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newRuleCollection, setNewRuleCollection] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchCollections();
  }, []);

  const fetchRules = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("auto_rules")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) {
      setRules(data || []);
    }

    setLoading(false);
  };

  const fetchCollections = async () => {
    const { data, error } = await supabase
      .from("collections")
      .select("id, name, icon")
      .eq("user_id", userId)
      .order("name");

    if (!error) {
      setCollections(data || []);
    }
  };

  const handleCreateRule = async () => {
    if (!newRuleName.trim() || !newRuleValue.trim() || !newRuleCollection) {
      alert("Completa todos los campos para crear la regla.");
      return;
    }

    setCreating(true);

    const { error } = await supabase.from("auto_rules").insert({
      user_id: userId,
      name: newRuleName.trim(),
      match_type: newRuleType,
      match_value: newRuleValue.trim().toLowerCase(),
      collection_id: newRuleCollection,
      is_active: true,
    });

    if (!error) {
      setNewRuleName("");
      setNewRuleType("domain");
      setNewRuleValue("");
      setNewRuleCollection("");
      fetchRules();
    } else {
      alert("Error al crear regla: " + error.message);
    }

    setCreating(false);
  };

  const handleToggleRule = async (rule: Rule) => {
    const { error } = await supabase
      .from("auto_rules")
      .update({ is_active: !rule.is_active })
      .eq("id", rule.id);

    if (!error) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === rule.id ? { ...r, is_active: !r.is_active } : r
        )
      );
    }
  };

  const handleDeleteRule = async (rule: Rule) => {
    if (!confirm(`¿Eliminar la regla "${rule.name}"?`)) return;

    const { error } = await supabase
      .from("auto_rules")
      .delete()
      .eq("id", rule.id);

    if (!error) {
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
    }
  };

  const handleApplyToAll = async () => {
    if (
      !confirm(
        "¿Aplicar todas las reglas activas a tus marcadores existentes?\n\nEsto asignará automáticamente los marcadores a las colecciones según las reglas."
      )
    )
      return;

    setApplying(true);
    setApplyResult(null);

    const count = await applyAutoRulesToAll(supabase, userId);

    setApplyResult(
      `✅ ${count} marcador${count !== 1 ? "es" : ""} asignado${
        count !== 1 ? "s" : ""
      } automáticamente`
    );

    setApplying(false);

    // Limpiar el mensaje después de 5 segundos
    setTimeout(() => setApplyResult(null), 5000);
  };

  const getCollectionName = (collectionId: string | null): string => {
    if (!collectionId) return "Sin colección";
    const collection = collections.find((c) => c.id === collectionId);
    return collection
      ? `${collection.icon || "📁"} ${collection.name}`
      : "Colección eliminada";
  };

  const activeRulesCount = rules.filter((r) => r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            🎯 Colecciones inteligentes
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {rules.length} regla{rules.length !== 1 ? "s" : ""} •{" "}
            {activeRulesCount} activa{activeRulesCount !== 1 ? "s" : ""}
          </p>
        </div>

        {rules.length > 0 && (
          <button
            onClick={handleApplyToAll}
            disabled={applying || activeRulesCount === 0}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applying ? "Aplicando..." : "⚡ Aplicar a todos"}
          </button>
        )}
      </div>

      {/* Resultado de aplicar */}
      {applyResult && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-400">{applyResult}</p>
        </div>
      )}

      {/* Info sobre cómo funciona */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
        <p className="text-sm text-blue-400 flex items-start gap-2">
          <span className="shrink-0">💡</span>
          <span>
            Las reglas se aplican automáticamente al agregar nuevos marcadores.
            También puedes aplicarlas a todos tus marcadores existentes con el
            botón "⚡ Aplicar a todos".
          </span>
        </p>
      </div>

      {/* Crear nueva regla */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-4 text-base font-semibold text-white flex items-center gap-2">
          ➕ Crear nueva regla
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Nombre de la regla */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Nombre de la regla
            </label>
            <input
              type="text"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              placeholder='Ej: "Videos de YouTube"'
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Tipo de coincidencia */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Si coincide con...
            </label>
            <select
              value={newRuleType}
              onChange={(e) =>
                setNewRuleType(e.target.value as "domain" | "keyword")
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="domain">🌐 Dominio (ej: youtube.com)</option>
              <option value="keyword">🔤 Palabra clave en URL</option>
            </select>
          </div>

          {/* Valor a coincidir */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {newRuleType === "domain" ? "Dominio" : "Palabra clave"}
            </label>
            <input
              type="text"
              value={newRuleValue}
              onChange={(e) => setNewRuleValue(e.target.value)}
              placeholder={
                newRuleType === "domain" ? "youtube.com" : "tutorial"
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Colección destino */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Asignar a colección
            </label>
            <select
              value={newRuleCollection}
              onChange={(e) => setNewRuleCollection(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Selecciona una colección...</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.icon || "📁"} {collection.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateRule}
          disabled={creating}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Creando..." : "➕ Crear regla"}
        </button>
      </div>

      {/* Lista de reglas */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-300">
          📋 Tus reglas ({rules.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <p className="text-slate-400">Cargando reglas...</p>
            </div>
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 py-16 text-center">
            <p className="mb-3 text-5xl">🎯</p>
            <p className="mb-1 font-medium text-white">No tienes reglas creadas</p>
            <p className="text-sm text-slate-400">
              Crea tu primera regla usando el formulario de arriba
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`group flex items-center gap-4 rounded-2xl border bg-slate-900 p-4 transition ${
                  rule.is_active
                    ? "border-slate-700"
                    : "border-slate-800 opacity-60"
                }`}
              >
                {/* Indicador de estado */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
                    rule.is_active ? "bg-blue-500/20" : "bg-slate-800"
                  }`}
                >
                  {rule.match_type === "domain" ? "🌐" : "🔤"}
                </div>

                {/* Info de la regla */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">
                    {rule.name}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {rule.match_type === "domain" ? "Dominio" : "Palabra clave"}:{" "}
                    <span className="text-blue-400 font-mono">
                      {rule.match_value}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    → {getCollectionName(rule.collection_id)}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex shrink-0 items-center gap-2">
                  {/* Toggle activo */}
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className={`relative h-6 w-11 rounded-full transition ${
                      rule.is_active ? "bg-blue-600" : "bg-slate-700"
                    }`}
                    title={rule.is_active ? "Desactivar" : "Activar"}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                        rule.is_active ? "left-5.5" : "left-0.5"
                      }`}
                      style={{
                        left: rule.is_active ? "22px" : "2px",
                      }}
                    ></span>
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleDeleteRule(rule)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400"
                    title="Eliminar regla"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}