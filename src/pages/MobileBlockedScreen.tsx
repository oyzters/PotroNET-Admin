import { ShieldAlertIcon, MonitorIcon } from 'lucide-react';

export function MobileBlockedScreen() {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#09090b] text-foreground overflow-hidden selection:bg-primary/30">
            {/* Soft background glow similar to Mastra's welcome page */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 opacity-50 blur-[120px]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 opacity-50 blur-[100px]" />

            {/* Content card */}
            <div className="relative z-10 flex w-[90%] max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/10 bg-black/40 p-10 text-center shadow-2xl backdrop-blur-xl">
                {/* Icons */}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/5 bg-white/5 shadow-inner">
                    <MonitorIcon className="h-10 w-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#09090b] bg-destructive">
                        <ShieldAlertIcon className="h-4 w-4 text-white" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                        Acceso Restringido
                    </h1>
                    <p className="text-sm leading-relaxed text-zinc-400">
                        El panel de administración de PotroNET es una herramienta avanzada que requiere mayor espacio en pantalla.
                        <br /><br />
                        <strong className="text-zinc-200">Por favor, inicia sesión desde una computadora de escritorio.</strong>
                    </p>
                </div>

                {/* Footer or link */}
                <div className="mt-4 flex w-full flex-col gap-3 border-t border-white/10 pt-6">
                    <a
                        href="https://potronet.com"
                        className="flex w-full items-center justify-center rounded-xl bg-white/10 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 active:scale-[0.98]"
                    >
                        Volver a PotroNET
                    </a>
                </div>
            </div>

            {/* Watermark */}
            <div className="absolute bottom-6 text-xs font-medium tracking-widest text-zinc-600 uppercase">
                PotroNET Admin System
            </div>
        </div>
    );
}
