"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import * as LucideIcons from "lucide-react";

// ============ REPOSITORIO 1: ICONOS UI (LUCIDE) ============
// Array.from(new Set(...)) elimina duplicados automáticamente
const LUCIDE_ICONS = Array.from(new Set([
  "Folder", "FolderOpen", "FolderPlus", "FolderMinus", "FolderArchive",
  "File", "FileText", "FileCode", "FileImage", "FileVideo", "FileAudio",
  "FileSpreadsheet", "FileCheck", "FileX", "FileSearch",
  "Star", "Heart", "Bookmark", "BookmarkCheck", "BookmarkPlus", "Flag",
  "Tag", "Tags", "Link", "Link2", "Paperclip", "Pin",
  "Globe", "Code", "Terminal", "Database", "Server", "Cloud", "Wifi",
  "Github", "GitBranch", "GitCommit", "GitPullRequest", "Code2", "Bug",
  "Cpu", "HardDrive", "Usb", "Bluetooth", "Smartphone", "Laptop", "Monitor",
  "Briefcase", "Building2", "Building", "Landmark", "Warehouse", "Store",
  "ShoppingCart", "ShoppingBag", "Receipt", "Wallet", "CreditCard", "Banknote",
  "Coins", "TrendingUp", "TrendingDown", "BarChart", "BarChart2", "PieChart",
  "LineChart", "Activity", "Target", "BadgeCheck", "Award", "Trophy", "Medal",
  "Book", "BookOpen", "BookMarked", "Library", "GraduationCap", "School",
  "PenTool", "Pencil", "Highlighter", "Underline", "Type", "Languages",
  "Leaf", "Flower", "Flower2", "TreePine", "TreeDeciduous", "Mountain",
  "Sun", "Moon", "CloudRain", "Snowflake", "Flame",
  "Droplet", "Waves", "Umbrella", "Rainbow", "Wind",
  "Apple", "Cherry", "Grape", "Banana", "Orange", "Pizza", "Coffee", "CupSoda",
  "Utensils", "UtensilsCrossed", "Sandwich", "Cake", "Cookie", "IceCream",
  "Beef", "Fish", "Croissant", "Soup",
  "Plane", "Car", "Taxi", "Bus", "Train", "Ship", "Anchor", "Rocket",
  "Bike", "Motorcycle", "Map", "MapPin", "Navigation", "Compass",
  "Suitcase", "Luggage", "Ticket", "Milestone",
  "User", "UserPlus", "Users", "UserCheck", "UserX", "HeartPulse",
  "Stethoscope", "Syringe", "Pill", "Dumbbell", "Smile", "Frown", "Meh",
  "Laugh", "Baby", "Accessibility",
  "Wrench", "Hammer", "Screwdriver", "Scissors", "Ruler",
  "Settings", "Sliders", "Filter", "Search", "ZoomIn", "ZoomOut",
  "Lock", "LockOpen", "Key", "KeyRound", "Shield", "ShieldCheck", "ShieldAlert",
  "Eye", "EyeOff", "Fingerprint", "Scan",
  "Mail", "MailOpen", "Inbox", "Send", "MessageCircle", "MessageSquare",
  "Phone", "PhoneCall", "PhoneIncoming", "PhoneOutgoing", "PhoneMissed",
  "AtSign", "Bell", "BellRing", "Megaphone",
  "Music", "Music2", "Headphones", "Radio", "Mic", "Volume2", "VolumeX",
  "Play", "Pause", "SkipForward", "SkipBack", "Camera", "Video", "Film",
  "Tv", "Clapperboard", "Gamepad2", "Joystick", "Dice5",
  "CheckCircle", "CheckCircle2", "Check", "X", "XCircle", "AlertCircle",
  "AlertTriangle", "Info", "HelpCircle", "Clock", "Timer",
  "Calendar", "CalendarCheck", "CalendarX", "Hourglass",
  "Circle", "Square", "Triangle", "Hexagon", "Pentagon", "Diamond",
  "LayoutGrid", "LayoutList", "Columns", "Rows", "PanelLeft", "PanelRight",
  "Maximize2", "Minimize2", "ExternalLink", "Copy", "Clipboard",
  "Save", "Download", "Upload", "Trash2", "RefreshCw", "Power",
  "Sparkles", "Crown", "Gem", "Gift", "PartyPopper",
  "Zap", "Lightbulb", "Microscope", "FlaskConical", "Atom", "Telescope",
  "Satellite", "Sword", "Scroll", "Feather", "Palette", "Brush",
  "Puzzle", "Package", "Box", "Archive", "Truck",
]));

// ============ REPOSITORIO 2: EMOJIS ============
const EMOJIS = Array.from(new Set([
  "📁", "", "🗂️", "📄", "📑", "", "", "📝", "✏️", "🖊️", "🖍️", "📎", "📐", "", "✂️",
  "💻", "🖥️", "⌨️", "🖱️", "🖨️", "📱", "", "🔌", "🔋", "💾", "💿", "📀", "📷", "", "",
  "", "🔗", "🌍", "🌎", "", "🗺️", "🧭", "", "📶", "🔒", "🔓", "", "️",
  "💰", "💵", "💴", "💶", "💷", "🪙", "💳", "🧾", "📈", "📉", "💹", "🏦",
  "💼", "🏢", "", "🏭", "🏗️", "📊",
  "📚", "", "📕", "📗", "📘", "📙", "", "",
  "", "🖌️", "🎭", "🎬", "", "🎧", "🎵", "🎶",
  "🌸", "🌺", "", "", "🌷", "🌼", "🌱", "", "", "🌴", "🌵", "🍃", "🍂", "",
  "", "🍊", "🍋", "", "", "🍇", "🍓", "", "", "🍑", "🥭", "", "",
  "🍅", "🍆", "", "", "🥕", "🌽", "", "", "🍟", "🌭", "", "", "🍰", "",
  "☕", "🧋", "", "", "🍺", "🍷", "", "",
  "😀", "😃", "😄", "😁", "😆", "😊", "😍", "🥰", "😎", "🤓", "🧐", "", "", "😇",
  "❤️", "🧡", "", "💚", "", "💜", "", "", "💔", "️", "💕", "💞", "💓", "💗",
  "👍", "👎", "", "✌️", "🤞", "🤟", "", "", "👋", "🙏", "", "", "✍️",
  "⭐", "🌟", "✨", "💫", "🔥", "💥", "⚡", "", "☀️", "🌙", "🌤️", "⛅", "️",
  "️", "️", "🌨️", "❄️", "☃️", "🌊", "🌫️", "🌬️",
  "⚽", "", "", "⚾", "🥎", "", "", "🏉", "🎱", "", "", "🥊", "🥋", "⛳",
  "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🔩", "⚙️", "🧱", "⛓️", "🧲", "🔬", "",
  "✅", "❌", "", "", "", "⚠️", "🚸", "♻️", "🔰",
  "🚗", "🚕", "", "🚌", "🚎", "️", "", "", "🚒", "🚐", "", "", "🚛",
  "✈️", "🛫", "🛬", "", "", "🚁", "🚂", "", "", "🚊", "🚢", "",
  "🏠", "🏡", "️", "️", "️", "", "", "🗽", "⛩️", "🕌", "⛪",
  "🔖", "", "", "🗓️", "🗒️", "📔", "📒", "📓",
]));

// ============ COMPONENTE PARA MOSTRAR UN ICONO GUARDADO ============
export function IconDisplay({
  icon,
  size = 18,
  className = "",
}: {
  icon: string | null;
  size?: number;
  className?: string;
}) {
  if (!icon) return null;

  if (icon.startsWith("lucide:")) {
    const name = icon.replace("lucide:", "");
    const IconComponent = (LucideIcons as Record<string, unknown>)[name] as
      | ComponentType<{ size?: number; className?: string }>
      | undefined;

    if (IconComponent) {
      return <IconComponent size={size} className={className} />;
    }
    return null;
  }

  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {icon}
    </span>
  );
}

// ============ SELECTOR DE ICONOS (2 REPOSITORIOS) ============
type IconPickerProps = {
  value: string | null;
  onChange: (icon: string) => void;
  isDarkMode: boolean;
};

export function IconPicker({ value, onChange, isDarkMode }: IconPickerProps) {
  const [tab, setTab] = useState<"emoji" | "ui">("emoji");
  const [search, setSearch] = useState("");

  const filteredLucide = LUCIDE_ICONS.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`rounded-xl border p-3 ${
        isDarkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-300 bg-slate-50"
      }`}
    >
      {/* Encabezado: vista previa + quitar */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Icono
          </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              isDarkMode ? "border-slate-600 bg-slate-700" : "border-slate-300 bg-white"
            }`}
          >
            {value ? (
              <IconDisplay icon={value} size={16} />
            ) : (
              <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>—</span>
            )}
          </span>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className={`text-xs underline ${
              isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Quitar
          </button>
        )}
      </div>

      {/* Pestañas de repositorios */}
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("emoji")}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
            tab === "emoji"
              ? "bg-blue-600 text-white"
              : isDarkMode
              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
          }`}
        >
          😀 Emojis ({EMOJIS.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("ui")}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
            tab === "ui"
              ? "bg-blue-600 text-white"
              : isDarkMode
              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
          }`}
        >
          🎨 Iconos UI ({LUCIDE_ICONS.length})
        </button>
      </div>

      {/* Buscador (solo iconos UI) */}
      {tab === "ui" && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar: github, star, rocket..."
          className={`mb-2 w-full rounded-lg border px-3 py-1.5 text-sm outline-none ${
            isDarkMode
              ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400"
              : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
          }`}
        />
      )}

      {/* Cuadrícula de iconos */}
      <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
        {tab === "emoji"
          ? EMOJIS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => onChange(emoji)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition ${
                  value === emoji
                    ? "bg-blue-600/30 ring-2 ring-blue-500"
                    : isDarkMode
                    ? "hover:bg-slate-600"
                    : "hover:bg-slate-200"
                }`}
              >
                {emoji}
              </button>
            ))
          : filteredLucide.map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => onChange(`lucide:${name}`)}
                title={name}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  value === `lucide:${name}`
                    ? "bg-blue-600/30 text-blue-500 ring-2 ring-blue-500"
                    : isDarkMode
                    ? "text-slate-300 hover:bg-slate-600"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <IconDisplay icon={`lucide:${name}`} size={16} />
              </button>
            ))}
      </div>
    </div>
  );
}