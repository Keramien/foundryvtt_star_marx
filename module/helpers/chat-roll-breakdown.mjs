import { SYSTEM_ID } from "./config.mjs";

const ROLL_BREAKDOWN_FLAG = "rollBreakdown";

export function registerStarMarxChatRollBreakdownHooks(hooks = globalThis.Hooks) {
  if (!hooks?.on) return;
  hooks.on("renderChatMessageHTML", injectStarMarxChatRollBreakdown);
  hooks.on("renderChatMessage", injectStarMarxChatRollBreakdown);
}

export function injectStarMarxChatRollBreakdown(message, html) {
  const root = toHTMLElement(html);
  if (!root || root.querySelector(".star-marx-roll-breakdown, .star-marx-damage-roll, .star-marx-help-roll")) return;

  const breakdown = getRollBreakdownFlag(message);
  if (!breakdown) return;

  const diceRolls = root.querySelector(".dice-rolls");
  const diceResult = root.querySelector(".dice-result");
  if (!diceRolls || !diceResult) return;
  const diceRoll = diceResult.closest(".dice-roll") ?? diceResult;

  const rollDetails = renderRollDetails(breakdown.rollRows);
  const damageDetails = renderDamageDetails(breakdown.damage);
  const helpDetails = renderHelpDetails(breakdown.help);
  if (rollDetails) diceRolls.insertAdjacentHTML("afterend", rollDetails);
  if (damageDetails) diceRoll.insertAdjacentHTML("afterend", damageDetails);
  if (helpDetails) diceRoll.insertAdjacentHTML("afterend", helpDetails);

  for (const toggle of root.querySelectorAll("[data-star-marx-damage-toggle]")) {
    toggle.addEventListener("click", onDamageToggle);
    toggle.addEventListener("keydown", onDamageToggleKeydown);
  }
}

function getRollBreakdownFlag(message) {
  return message?.getFlag?.(SYSTEM_ID, ROLL_BREAKDOWN_FLAG)
    ?? message?.flags?.[SYSTEM_ID]?.[ROLL_BREAKDOWN_FLAG]
    ?? null;
}

function renderRollDetails(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  return `
    <div class="star-marx-roll-breakdown">
      <ol class="star-marx-roll-breakdown__rows">
        ${rows.map(renderBreakdownRow).join("")}
      </ol>
    </div>`;
}

function renderDamageDetails(damage) {
  if (!damage || !Number.isFinite(Number(damage.total))) return "";
  return `
    <div class="star-marx-damage-roll dice-roll" data-star-marx-damage-roll>
      <div class="dice-result">
        <div class="dice-formula">${escapeHtml(damage.label)}</div>
        <div class="dice-tooltip star-marx-damage-tooltip">
          <ol class="star-marx-roll-breakdown__rows">
            ${(damage.rows ?? []).map(renderBreakdownRow).join("")}
          </ol>
        </div>
        <h4 class="dice-total star-marx-damage-total" role="button" tabindex="0" title="${escapeHtml(damage.toggleLabel ?? "")}" data-star-marx-damage-toggle>${escapeHtml(damage.total)}</h4>
      </div>
    </div>`;
}

function renderHelpDetails(help) {
  if (!help || !Number.isFinite(Number(help.total))) return "";
  return `
    <div class="star-marx-help-roll dice-roll">
      <div class="dice-result">
        <div class="dice-formula">${escapeHtml(help.label)}</div>
        <h4 class="dice-total star-marx-help-total">${escapeHtml(formatSignedNumber(help.total))}</h4>
      </div>
    </div>`;
}

function renderBreakdownRow(row) {
  return `<li>${escapeHtml(formatBreakdownRow(row))}</li>`;
}

function formatBreakdownRow(row) {
  if (row?.text) return row.text;
  const value = Number(row?.value ?? 0);
  return `${formatSignedNumber(value, { forceSign: row?.forceSign !== false })} ${row?.label ?? ""}`;
}

function formatSignedNumber(value, { forceSign = true } = {}) {
  const number = Number(value ?? 0);
  const sign = number > 0 && forceSign ? "+" : "";
  return `${sign}${number}`;
}

function onDamageToggle(event) {
  event.preventDefault();
  event.stopImmediatePropagation?.();
  event.stopPropagation();
  event.currentTarget.closest("[data-star-marx-damage-roll]")?.classList.toggle("expanded");
}

function onDamageToggleKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  onDamageToggle(event);
}

function toHTMLElement(html) {
  const HTMLElementClass = globalThis.HTMLElement;
  if (HTMLElementClass && html instanceof HTMLElementClass) return html;
  if (HTMLElementClass && html?.[0] instanceof HTMLElementClass) return html[0];
  return null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
