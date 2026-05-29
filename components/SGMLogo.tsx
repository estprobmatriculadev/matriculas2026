"use client";

export default function SGMLogo() {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* SVG Logo - Símbolo da Educação do Paraná (EP) */}
      <svg
        viewBox="0 0 48 48"
        className="w-10 h-10 text-primary"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Livro aberto (Educação) */}
        <path d="M24 6v36" />
        <path d="M24 6L12 12v24l12-6 12 6V12L24 6Z" />
        {/* Estrela (Excelência) */}
        <circle cx="24" cy="18" r="3" fill="currentColor" />
      </svg>
      
      {/* Texto */}
      <div className="text-center">
        <h2 className="font-black text-primary text-sm tracking-tighter leading-none">SGM</h2>
        <p className="text-[7px] uppercase font-black text-on-surface-variant tracking-tight opacity-80 leading-tight whitespace-nowrap">
          Matrículas e Gestão
        </p>
        <p className="text-[7px] uppercase font-black text-on-surface-variant tracking-tight opacity-80 leading-tight whitespace-nowrap">
          Estágio Probatório
        </p>
      </div>
    </div>
  );
}
