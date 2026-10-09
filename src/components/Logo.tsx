export default function Logo() {
  return (
    <span class="inline-flex items-center gap-2.5">
      <span class="grid size-[30px] place-items-center rounded-[9px] bg-primary">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F1C142"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 5H9a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h9" />
          <path d="M6 12h6.5" />
          <circle cx="17" cy="12" r="2.4" fill="#F1C142" stroke="none" />
        </svg>
      </span>
      <span class="text-[18px] font-bold tracking-[0.02em] text-base-content">EbinaStation</span>
    </span>
  );
}
