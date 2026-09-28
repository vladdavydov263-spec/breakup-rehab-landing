// Згода на регулярні списання перед формою оплати (вимога WayForPay до підписок).
// Вставляє блок з умовами підписки та чекбоксом (не відмічений за замовчуванням)
// перед віджетом Smartsender і не дає взаємодіяти з формою, доки згоду не дано.
(function () {
  var PRICE = 899;
  var OFERTA = "https://12.karpachoff.com/legal/oferta/";
  var PRIVACY = "https://12.karpachoff.com/legal/privacy/";

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function fmt(d) {
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
  }

  function nextCharge(from) {
    // те саме число наступного місяця; якщо в місяці менше днів — останній день
    var y = from.getFullYear(), m = from.getMonth() + 1, day = from.getDate();
    var last = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(day, last));
  }

  function build() {
    var today = new Date();
    var next = nextCharge(today);
    var day = today.getDate();
    var dayNote = day >= 29
      ? day + "-го числа (або в останній день місяця, якщо в ньому менше днів)"
      : day + "-го числа";

    var box = document.createElement("div");
    box.className = "sub-consent";
    box.innerHTML =
      '<p class="sub-consent__title">Умови підписки</p>' +
      '<ul class="sub-consent__terms">' +
        '<li><b>Сума:</b> ' + PRICE + ' грн</li>' +
        '<li><b>Періодичність:</b> раз на місяць, автоматично з тієї ж картки</li>' +
        '<li><b>Перше списання:</b> сьогодні, ' + fmt(today) + ', одразу після підтвердження оплати</li>' +
        '<li><b>Наступні списання:</b> щомісяця ' + dayNote + ', найближче — ' + fmt(next) + '</li>' +
        '<li>Скасувати можна будь-коли в 1 клік — наступних списань не буде. Про списання нагадуємо за 3 дні. На перший місяць діє 7 днів на повернення коштів.</li>' +
      '</ul>' +
      '<label class="sub-consent__check">' +
        '<input type="checkbox" id="recurringConsent" name="recurring_consent" value="yes">' +
        '<span>Погоджуюсь на щомісячне автоматичне списання ' + PRICE + ' грн та збереження даних картки для наступних списань. ' +
        'З <a href="' + OFERTA + '" target="_blank" rel="noopener">Публічною офертою</a> (розділ 4, умови підписки) та ' +
        '<a href="' + PRIVACY + '" target="_blank" rel="noopener">Політикою конфіденційності</a> ознайомлена.</span>' +
      '</label>';
    return box;
  }

  function injectStyles() {
    if (document.getElementById("sub-consent-css")) return;
    var css = document.createElement("style");
    css.id = "sub-consent-css";
    css.textContent =
      ".sub-consent{text-align:left;border:1px solid rgba(127,127,127,.35);border-radius:14px;padding:18px 20px;margin:0 0 18px;font-size:14.5px;line-height:1.55;color:inherit}" +
      ".sub-consent__title{margin:0 0 10px;font-weight:600;font-size:15px}" +
      ".sub-consent__terms{list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:6px;opacity:.9}" +
      ".sub-consent__terms b{font-weight:600}" +
      ".sub-consent__check{display:flex;gap:12px;align-items:flex-start;cursor:pointer;padding-top:14px;border-top:1px solid rgba(127,127,127,.3)}" +
      ".sub-consent__check input{flex:0 0 auto;width:20px;height:20px;margin:2px 0 0;cursor:pointer;accent-color:#E0A458}" +
      ".sub-consent__check a{color:inherit;text-decoration:underline;text-underline-offset:2px}" +
      ".sub-gate{position:relative}" +
      ".sub-gate__lock{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;" +
        "background:rgba(20,22,26,.55);color:#F2EEE7;font-size:15px;line-height:1.5;border-radius:12px;backdrop-filter:blur(2px);cursor:not-allowed}" +
      ".sub-gate--open .sub-gate__lock{display:none}";
    document.head.appendChild(css);
  }

  function init() {
    var widget = document.querySelector(".ss-landing");
    if (!widget || document.querySelector(".sub-consent")) return;
    injectStyles();

    var wrap = widget.closest(".price-form, .form-wrap") || widget;
    var consent = build();
    wrap.parentNode.insertBefore(consent, wrap);

    wrap.classList.add("sub-gate");
    var lock = document.createElement("div");
    lock.className = "sub-gate__lock";
    lock.textContent = "Щоб перейти до оплати, поставте позначку про згоду на щомісячне списання вище";
    wrap.appendChild(lock);

    lock.addEventListener("click", function () {
      consent.scrollIntoView({ behavior: "smooth", block: "center" });
      consent.classList.add("sub-consent--hint");
    });

    var cb = consent.querySelector("#recurringConsent");
    cb.checked = false;
    cb.addEventListener("change", function () {
      wrap.classList.toggle("sub-gate--open", cb.checked);
      // фіксуємо факт згоди у змінних контакту Smartsender (оферта, п. 3.5)
      if (window.ssContext && window.ssContext.variables) {
        window.ssContext.variables.recurring_consent = cb.checked ? new Date().toISOString() : "";
        window.ssContext.variables.recurring_amount = cb.checked ? String(PRICE) : "";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
