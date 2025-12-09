export function TronBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020204] pointer-events-none">

      {/* 1. ФОНОВАЯ КАРТИНКА (Город) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-60 z-0">
          <div
            className="w-full h-full bg-cover bg-center scale-110 blur-[2px]"
            style={{ backgroundImage: "url('../image/city.jpg')" }}
          />
          {/* Виньетка (сделал чуть мягче) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020204_100%)]" />
      </div>

      {/* 3. ПОЛ (Плавное исчезновение у горизонта) */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] perspective-corridor overflow-hidden z-20"
           style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 30%)" }}>
          {/* ^^^ ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ: маска вместо черной полосы */}

          <div className="corridor-grid moving-floor" />
      </div>

    </div>
  );
}