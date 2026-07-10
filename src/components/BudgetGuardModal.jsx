import React from "react";

export default function BudgetGuardModal({ budget, onApprove, onCancel, open }) {
  if (!open || !budget) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <p className="eyebrow">BUDGET GUARD</p>
        <h2>予算警告</h2>
        <p>この処理は有料APIまたはOwner承認必須処理の候補です。Phase1-Aでは、この確認だけで外部処理は実行されません。</p>
        <div className="mission-list">
          <div>利用額: {Number(budget.monthlyUsed || 0).toFixed(2)} USD</div>
          <div>月額上限: {Number(budget.monthlyBudgetLimit || 0).toFixed(2)} USD</div>
          <div>残り: {Number(budget.monthlyRemaining || 0).toFixed(2)} USD</div>
          <div>消化率: {Number(budget.monthlyRate || 0).toFixed(0)}%</div>
        </div>
        <div className="actions">
          <button onClick={onApprove}>確認して閉じる</button>
          <button onClick={onCancel}>キャンセル</button>
        </div>
      </div>
    </div>
  );
}
