// ==UserScript==
// @name         Hide Login/Register Buttons
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hide login and register buttons
// @match        http://localhost:*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function hideButtons() {
        const buttons = document.querySelectorAll('button, a');
        buttons.forEach(btn => {
            const text = btn.textContent || btn.innerText;
            if (text && (text.includes('Войти') || text.includes('Регистрация') || 
                         text.includes('Sign in') || text.includes('Sign up') ||
                         text.includes('Login') || text.includes('Register') ||
                         text.includes('Registration'))) {
                btn.style.display = 'none';
            }
        });
    }

    // Запускаем при загрузке
    setInterval(hideButtons, 300);
    
    // Наблюдатель за DOM
    const observer = new MutationObserver(hideButtons);
    observer.observe(document.body, { childList: true, subtree: true });
})();
