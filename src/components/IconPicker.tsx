"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import * as LucideIcons from "lucide-react";

// ============ REPOSITORIO 1: ICONOS UI (LUCIDE) - 300+ ICONOS ============
const LUCIDE_ICONS = Array.from(new Set([
  // 📁 Archivos y carpetas
  "Folder", "FolderOpen", "FolderPlus", "FolderMinus", "FolderArchive", "FolderClosed", "FolderDot",
  "FolderInput", "FolderOutput", "FolderSearch", "FolderSync", "FolderTree",
  "File", "FileText", "FileCode", "FileImage", "FileVideo", "FileAudio", "FileSpreadsheet",
  "FileCheck", "FileX", "FileSearch", "FileArchive", "FileBox", "FileClock", "FileCode2",
  "FileCog", "FileDiff", "FileDigit", "FileDown", "FileEdit", "FileHeart", "FileInput",
  "FileJson", "FileKey", "FileLock", "FileMinus", "FileOutput", "FilePen", "FilePlus",
  "FileQuestion", "FileScan", "FileSignature", "FileStack", "FileSymlink", "FileTerminal",
  "FileType", "FileUp", "FileVolume", "FileWarning",

  // ⭐ Favoritos y marcadores
  "Star", "Heart", "Bookmark", "BookmarkCheck", "BookmarkPlus", "BookmarkMinus", "BookmarkX",
  "Flag", "FlagOff", "FlagTriangleLeft", "FlagTriangleRight", "Pin", "PinOff",
  "Tag", "Tags", "Link", "Link2", "Link2Off", "Paperclip", "PaperclipOff",

  // 💻 Tecnología y desarrollo
  "Globe", "Code", "Code2", "CodeXml", "Terminal", "TerminalSquare", "Database", "Server",
  "Cloud", "CloudOff", "CloudDownload", "CloudUpload", "CloudRain", "CloudSnow", "CloudFog",
  "Wifi", "WifiOff", "Bluetooth", "BluetoothOff", "BluetoothSearching", "BluetoothConnected",
  "Github", "GitBranch", "GitBranchPlus", "GitCommit", "GitCommitHorizontal", "GitCommitVertical",
  "GitCompare", "GitCompareArrows", "GitFork", "GitGraph", "GitMerge", "GitPullRequest",
  "GitPullRequestArrow", "GitPullRequestClosed", "GitPullRequestDraft",
  "Cpu", "HardDrive", "HardDriveDownload", "HardDriveUpload", "Usb", "Binary",
  "Bug", "BugOff", "BugPlay",

  // 📱 Dispositivos
  "Smartphone", "SmartphoneNfc", "Laptop", "LaptopMinimal", "Monitor", "MonitorCheck",
  "MonitorCog", "MonitorDot", "MonitorDown", "MonitorOff", "MonitorPause", "MonitorPlay",
  "MonitorSmartphone", "MonitorSpeaker", "MonitorStop", "MonitorUp", "MonitorX",
  "Tablet", "TabletSmartphone", "Watch", "Keyboard", "Mouse", "MousePointer",
  "Printer", "PrinterCheck", "Scan", "ScanBarcode", "ScanEye", "ScanFace", "ScanLine",
  "ScanSearch", "ScanText", "QrCode",

  // 🏢 Negocios y finanzas
  "Briefcase", "BriefcaseBusiness", "BriefcaseMedical",
  "Building", "Building2", "Landmark", "Warehouse", "Store", "Factory", "House", "HousePlus",
  "ShoppingCart", "ShoppingBag", "ShoppingBasket", "Receipt", "Wallet", "WalletCards",
  "WalletMinimal", "CreditCard", "Banknote", "BanknoteArrowDown", "BanknoteArrowUp",
  "Coins", "CoinsExchange", "CoinsStacked",
  "TrendingUp", "TrendingDown", "BarChart", "BarChart2", "BarChart3", "BarChart4",
  "BarChartBig", "BarChartHorizontal", "BarChartHorizontalBig",
  "PieChart", "LineChart", "Activity", "Target", "BadgeCheck", "BadgePlus", "BadgeMinus",
  "BadgeEuro", "BadgeDollarSign", "BadgePercent", "BadgeIndianRupee", "BadgeJapaneseYen",
  "BadgePoundSterling", "BadgeRussianRuble", "BadgeSwissFranc",
  "Award", "Trophy", "Medal", "Crown", "Gem",

  // 📚 Educación y libros
  "Book", "BookOpen", "BookOpenCheck", "BookOpenText", "BookMarked", "BookCopy", "BookDashed",
  "BookDown", "BookHeart", "BookImage", "BookKey", "BookLock", "BookMinus", "BookPlus",
  "BookText", "BookType", "BookUp", "BookUp2", "BookUser", "BookX",
  "Library", "LibraryBig", "LibrarySquare", "GraduationCap", "School", "University",
  "Backpack", "Notebook", "NotebookPen", "NotebookTabs", "NotebookText",

  // ✏️ Escritura y edición
  "PenTool", "Pencil", "PencilLine", "PencilOff", "PencilRuler",
  "Highlighter", "Underline", "Strikethrough", "Type", "Types", "Languages",
  "Text", "TextCursor", "TextCursorInput", "TextQuote", "TextSearch", "TextSelect",
  "CaseLower", "CaseSensitive", "CaseUpper", "WholeWord",

  // 🌿 Naturaleza y clima
  "Leaf", "Flower", "Flower2", "TreePine", "TreeDeciduous", "TreePalm",
  "Mountain", "MountainSnow", "MountainOff",
  "Sun", "SunDim", "SunMedium", "SunMoon", "Sunrise", "Sunset", "Moon", "MoonStar",
  "CloudRain", "CloudLightning", "CloudDrizzle", "CloudHail", "CloudMoon", "CloudMoonRain",
  "CloudSun", "CloudSunRain",
  "Snowflake", "Flame", "FlameKindling",
  "Droplet", "Droplets", "Waves", "WavesLadder", "Umbrella", "Rainbow", "Wind", "WindArrowDown",
  "Tornado", "Hurricane", "Thermometer", "ThermometerSnowflake", "ThermometerSun",
  "Sprout", "Plant", "Cactus", "TreePine", "Trees",

  // 🍽️ Comida y bebidas
  "Apple", "Cherry", "Grape", "Banana", "Orange", "Lemon", "Strawberry", "Watermelon",
  "Peach", "Pear", "Pineapple", "Kiwi", "Mango", "Coconut",
  "Pizza", "Sandwich", "Hamburger", "Hotdog", "Taco", "Burrito", "Croissant", "Cookie",
  "Cake", "CakeSlice", "IceCream", "IceCreamBowl", "IceCreamCone", "Candy", "CandyCane", "CandyOff",
  "Beef", "Fish", "Bird", "BeefSlice", "Egg", "EggFried", "Soup", "Salad", "Noodles", "RiceBowl",
  "Coffee", "CupSoda", "Milk", "MilkOff", "Wine", "WineOff", "Beer", "BeerOff",
  "Tea", "Utensils", "UtensilsCrossed", "CookingPot", "ChefHat",

  // 🚗 Viajes y transporte
  "Plane", "PlaneTakeoff", "PlaneLanding", "Car", "CarTaxiFront", "CarFront", "Taxi",
  "Bus", "BusFront", "Train", "TrainFront", "TrainTrack", "Ship", "ShipWheel",
  "Anchor", "Rocket", "Satellite", "Bike", "Motorcycle", "Truck", "Tractor",
  "Ambulance", "FireExtinguisher", "Fuel",
  "Map", "MapPin", "MapPinOff", "MapPinned", "Navigation", "NavigationOff", "Compass",
  "Suitcase", "SuitcaseRolling", "Luggage", "Ticket", "TicketCheck", "TicketMinus",
  "TicketPlus", "TicketSlash", "TicketX", "Milestone", "Route", "RouteOff",

  // 👥 Personas y emociones
  "User", "UserPlus", "UserMinus", "UserCheck", "UserX", "UserCog", "UserRound",
  "UserRoundCheck", "UserRoundCog", "UserRoundMinus", "UserRoundPlus", "UserRoundSearch",
  "UserRoundX", "Users", "UsersRound",
  "HeartPulse", "Stethoscope", "Syringe", "Pill", "PillBottle", "Dumbbell",
  "Smile", "SmilePlus", "Frown", "Meh", "Laugh", "Grimace", "Angry",
  "Baby", "Accessibility", "Hand", "Handshake", "HandHeart", "HandCoins", "HandHelping",
  "HandMetal", "HandPlatter",
  "Heart", "HeartCrack", "HeartHandshake", "HeartOff", "HeartPulse",
  "ThumbsUp", "ThumbsDown", "Clap", "Wave", "Fingerprint", "ScanFingerprint",

  // 🛠️ Herramientas y configuración
  "Wrench", "Hammer", "Screwdriver", "Scissors", "Ruler", "RulerSquare", "RulerSquareCompass",
  "Settings", "Settings2", "Sliders", "SlidersHorizontal", "SlidersVertical",
  "Filter", "FilterX", "Search", "SearchCheck", "SearchCode", "SearchSlash", "SearchX",
  "ZoomIn", "ZoomOut",
  "Lock", "LockOpen", "LockKeyhole", "LockKeyholeOpen",
  "Key", "KeyRound", "KeySquare",
  "Shield", "ShieldCheck", "ShieldAlert", "ShieldBan", "ShieldClose", "ShieldEllipsis",
  "ShieldHalf", "ShieldMinus", "ShieldOff", "ShieldPlus", "ShieldQuestion", "ShieldX",
  "Eye", "EyeOff", "EyeClosed",

  // 💬 Comunicación
  "Mail", "MailCheck", "MailMinus", "MailOpen", "MailPlus", "MailQuestion", "MailSearch",
  "MailWarning", "MailX",
  "Inbox", "Send", "SendHorizontal", "SendToBack",
  "MessageCircle", "MessageCircleCode", "MessageCircleDashed", "MessageCircleHeart",
  "MessageCircleMore", "MessageCircleOff", "MessageCirclePlus", "MessageCircleQuestion",
  "MessageCircleReply", "MessageCircleWarning", "MessageCircleX",
  "MessageSquare", "MessageSquareCode", "MessageSquareDashed", "MessageSquareDiff",
  "MessageSquareDot", "MessageSquareHeart", "MessageSquareLock", "MessageSquareMore",
  "MessageSquareOff", "MessageSquarePlus", "MessageSquareQuote", "MessageSquareReply",
  "MessageSquareShare", "MessageSquareText", "MessageSquareWarning", "MessageSquareX",
  "Phone", "PhoneCall", "PhoneForwarded", "PhoneIncoming", "PhoneMissed", "PhoneOff",
  "PhoneOutgoing", "AtSign", "Hash", "Mention",
  "Bell", "BellDot", "BellElectric", "BellMinus", "BellOff", "BellPlus", "BellRing",
  "Megaphone", "MegaphoneOff", "Speaker",

  // 🎵 Multimedia y entretenimiento
  "Music", "Music2", "Music3", "Music4", "Headphones", "Radio", "Mic", "MicOff",
  "Volume", "Volume1", "Volume2", "VolumeX",
  "Play", "Pause", "SkipForward", "SkipBack", "SquarePlay", "SquarePause",
  "Camera", "CameraOff", "Video", "VideoOff", "Film", "Clapperboard",
  "Tv", "TvMinimal", "TvMinimalPlay",
  "Gamepad", "Gamepad2", "Joystick", "Dice1", "Dice2", "Dice3", "Dice4", "Dice5", "Dice6",

  // ✅ Estados y alertas
  "Check", "CheckCheck", "CircleCheck", "CircleCheckBig", "SquareCheck", "SquareCheckBig",
  "X", "CircleX", "SquareX",
  "AlertCircle", "AlertTriangle", "AlertOctagon", "Info", "HelpCircle",
  "Clock", "Clock1", "Clock2", "Clock3", "Clock4", "Clock5", "Clock6", "Clock7", "Clock8",
  "Clock9", "Clock10", "Clock11", "Clock12", "Timer", "TimerOff", "TimerReset",
  "AlarmClock", "AlarmClockCheck", "AlarmClockMinus", "AlarmClockOff", "AlarmClockPlus",
  "Calendar", "CalendarCheck", "CalendarCheck2", "CalendarClock", "CalendarCog",
  "CalendarDays", "CalendarDot", "CalendarFold", "CalendarHeart", "CalendarMinus",
  "CalendarMinus2", "CalendarOff", "CalendarPlus", "CalendarPlus2", "CalendarRange",
  "CalendarSearch", "CalendarX", "CalendarX2",
  "Hourglass", "Watch", "Stopwatch",

  // 🔷 Formas y diseño
  "Circle", "CircleDot", "CircleDashed", "CircleEqual", "CircleOff", "CircleSlashed",
  "Square", "SquareDashed", "SquareDot", "SquareEqual",
  "Triangle", "TriangleRight", "Diamond", "Pentagon", "Hexagon", "Octagon",
  "Star", "StarHalf", "StarOff",
  "LayoutGrid", "LayoutList", "LayoutDashboard", "LayoutPanelLeft", "LayoutPanelRight",
  "LayoutPanelTop", "Columns", "Columns2", "Columns3", "Columns4",
  "Rows", "Rows2", "Rows3", "Rows4",
  "PanelLeft", "PanelRight", "PanelTop", "PanelBottom", "PanelLeftClose", "PanelRightClose",
  "Maximize", "Maximize2", "Minimize", "Minimize2",
  "ExternalLink", "Copy", "Clipboard", "ClipboardCheck", "ClipboardCopy", "ClipboardList",
  "ClipboardMinus", "ClipboardPaste", "ClipboardPen", "ClipboardPlus", "ClipboardType", "ClipboardX",
  "Save", "SaveAll", "SaveOff",
  "Download", "Upload", "Trash", "Trash2", "RefreshCw", "RefreshCcw", "Power", "PowerOff",

  // ✨ Especiales y divertidos
  "Sparkles", "Crown", "Gem", "Gift", "PartyPopper", "Confetti", "Firework",
  "Zap", "ZapOff", "Lightbulb", "LightbulbOff",
  "Microscope", "FlaskConical", "FlaskRound", "Atom", "Telescope", "Satellite",
  "Sword", "Swords", "Scroll", "ScrollText", "Feather", "Palette", "Brush", "Paintbrush",
  "PaintbrushVertical", "PaintRoller", "PaintBucket", "SprayCan",
  "Puzzle", "PuzzlePiece", "Package", "PackageCheck", "PackageMinus", "PackageOpen",
  "PackagePlus", "PackageSearch", "PackageX", "Box", "BoxSelect",
  "Archive", "ArchiveRestore", "ArchiveX", "Truck", "Container",

  // 🤖 IA y tecnología moderna
  "Bot", "BotMessageSquare", "BotOff", "Brain", "BrainCircuit", "BrainCog",
  "Wand", "WandSparkles", "Sparkle", "CircuitBoard", "Workflow",
  "Network", "NetworkSlash", "Webhook", "WebhookOff",
  "Orbit", "Orbiting", "SatelliteDish", "Radar", "Radio",
  "Scan", "ScanBarcode", "ScanEye", "ScanFace", "ScanLine", "ScanSearch", "ScanText",

  // 🏗️ Arquitectura y construcción
  "House", "HousePlug", "HouseWifi", "Home", "Building", "Building2", "Factory",
  "Hospital", "School", "University", "Church", "Castle", "Tent", "TentTree",
  "DoorOpen", "DoorClosed", "Fence", "Wall", "Braces", "Brackets",
  "Hammer", "HardHat", "Construction", "TapeMeasure", "Level", "Trowel",

  // 🐾 Animales
  "Dog", "Cat", "Fish", "Bird", "Rabbit", "Turtle", "Bug", "BugOff", "BugPlay",
  "Beef", "FishSymbol", "Shrimp", "Squid", "Whale", "Dolphin", "Shark", "Octopus",
  "Cow", "Pig", "Sheep", "Horse", "Rabbit", "Squirrel", "Fox", "Bear", "Panda",
  "Koala", "Crocodile", "Snake", "Frog", "Bat", "Owl", "Eagle", "Parrot", "Flamingo",
  "Penguin", "Seal", "Otter", "Whale", "Duck", "Chicken", "Rooster", "Turkey",

  // 📱 Redes sociales (genéricos)
  "Twitter", "Facebook", "Instagram", "Linkedin", "Youtube", "Twitch", "Discord",
  "Slack", "Tiktok", "Snapchat", "Pinterest", "Reddit", "Tumblr", "Vimeo", "Dribbble",

  // 🔧 Más herramientas y acciones
  "Plus", "Minus", "PlusCircle", "MinusCircle", "PlusSquare", "MinusSquare",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "ArrowUpCircle", "ArrowDownCircle", "ArrowLeftCircle", "ArrowRightCircle",
  "ChevronUp", "ChevronDown", "ChevronLeft", "ChevronRight",
  "ChevronsUp", "ChevronsDown", "ChevronsLeft", "ChevronsRight",
  "CornerUpLeft", "CornerUpRight", "CornerDownLeft", "CornerDownRight",
  "Undo", "Redo", "Undo2", "Redo2", "RotateCw", "RotateCcw",
  "Expand", "Shrink", "Move", "MoveHorizontal", "MoveVertical", "MoveDiagonal",
  "Grab", "GrabHorizontal", "GrabVertical",
  "MousePointer", "MousePointer2", "MousePointerClick", "MousePointerSquare", "Mouse",

  // 💡 Símbolos diversos
  "Percent", "Ampersand", "AtSign", "Hash", "Copyright", "Trademark", "Registered",
  "Infinity", "Divide", "Equal", "NotEqual", "Sigma", "Pi", "Omega", "Delta",
  "SquarePi", "SquareSigma", "SquareSqrt", "SquareRadical",
  "Copyright", "CreativeCommons", "CreativeCommonsZero",
  "Asterisk", "AtSign", "Hash", "NumberSign",
  "Currency", "DollarSign", "Euro", "PoundSterling", "Yen", "Rupee", "Franc", "Ruble", "Bitcoin",
]));

// ============ REPOSITORIO 2: EMOJIS ============
const EMOJIS = Array.from(new Set([
  "📁", "📂", "🗂️", "📄", "📑", "📃", "📋", "📝", "✏️", "🖊️", "🖍️", "📎", "📐", "📏", "✂️",
  "💻", "🖥️", "⌨️", "🖱️", "🖨️", "📱", "☎️", "🔌", "🔋", "💾", "💿", "📀", "📷", "📸", "📹",
  "🎥", "🔗", "🌍", "🌎", "🌏", "🗺️", "🧭", "📍", "📶", "🔒", "🔓", "🔑", "🗝️",
  "💰", "💵", "💴", "💶", "💷", "🪙", "💳", "🧾", "📈", "📉", "💹", "🏦",
  "💼", "🏢", "🏬", "🏭", "🏗️", "📊", "📉", "📊",
  "📚", "📖", "📕", "📗", "📘", "📙", "📓", "📒",
  "🎨", "🖌️", "🎭", "🎬", "🎤", "🎧", "🎵", "🎶",
  "🌸", "🌺", "🌻", "🌹", "🌷", "🌼", "🌱", "🌲", "🌳", "🌴", "🌵", "🍃", "🍂", "🍁",
  "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍑", "🥭", "🍍", "🥥",
  "🍅", "🍆", "🥑", "🥦", "🥕", "🌽", "🥔", "🍠", "🍟", "🌭", "🍔", "🍕", "🍰", "🎂",
  "☕", "🧋", "🍵", "🥤", "🍺", "🍷", "🥂", "🍸",
  "😀", "😃", "😄", "😁", "😆", "😊", "😍", "🥰", "😎", "🤓", "🧐", "🤔", "😐", "😇",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💓", "💗",
  "👍", "👎", "👊", "✌️", "🤞", "🤟", "🤘", "👌", "👋", "🙏", "💪", "🤝", "✍️",
  "⭐", "🌟", "✨", "💫", "🔥", "💥", "⚡", "☄️", "☀️", "🌙", "🌤️", "⛅", "☁️",
  "❄️", "☃️", "🌊", "🌫️", "🌬️",
  "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "⛳",
  "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🔩", "⚙️", "🧱", "⛓️", "🧲", "🔬", "🔭",
  "✅", "❌", "⭕", "❗", "❓", "⚠️", "🚸", "♻️", "🔰",
  "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛",
  "✈️", "🛫", "🛬", "🛩️", "🚀", "🚁", "🚂", "🚆", "🚇", "🚊", "🚢", "⛵",
  "🏠", "🏡", "🏘️", "🏚️", "🏛️", "🏰", "🗽", "⛩️", "🕌", "⛪",
  "🔖", "🏷️", "🔗", "🗓️", "🗒️", "📔", "📒", "📓",
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
  "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗",
  "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞",
  "🤖", "👾", "🎮", "🕹️", "🎲", "♟️", "🎯", "🎳",
  "💎", "💍", "👑", "🎁", "🎀", "🎈", "🎉", "🎊",
  "🧠", "💡", "🔍", "🔎", "🔬", "🔭", "📡", "⚛️",
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

// ============ SELECTOR DE ICONOS (2 REPOSITORIOS, 300+ ICONOS UI) ============
type IconPickerProps = {
  value: string | null;
  onChange: (icon: string) => void;
  isDarkMode: boolean;
};

export function IconPicker({ value, onChange, isDarkMode }: IconPickerProps) {
  const [tab, setTab] = useState<"emoji" | "ui">("emoji");
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filteredLucide = LUCIDE_ICONS.filter((name) =>
    name.toLowerCase().includes(q)
  );
  const filteredEmojis = q
    ? EMOJIS.filter((e) => e.includes(q))
    : EMOJIS;

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
          <span
            className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
          >
            {tab === "ui" ? `${filteredLucide.length} iconos` : `${filteredEmojis.length} emojis`}
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
          onClick={() => {
            setTab("emoji");
            setSearch("");
          }}
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
          onClick={() => {
            setTab("ui");
            setSearch("");
          }}
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

      {/* Buscador */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          tab === "ui"
            ? "Buscar: github, star, rocket, bot..."
            : "Buscar emoji (ej: fire, cat, pizza)"
        }
        className={`mb-2 w-full rounded-lg border px-3 py-1.5 text-sm outline-none ${
          isDarkMode
            ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400"
            : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
        }`}
      />

      {/* Cuadrícula de iconos */}
      <div className="grid max-h-64 grid-cols-9 gap-1 overflow-y-auto">
        {tab === "emoji"
          ? filteredEmojis.map((emoji) => (
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