// 0.9.3 — integrate Calendar into existing Diary
(function(){
    const originalOpenHistory = window.openHistory;
    window.openHistory = function(){
        if (window.diaryMode !== "calendar") return originalOpenHistory();
        const content=document.getElementById("content");
        if(!content) return;
        const cats=getCats(); if(!cats.length){renderEmptyState();return;}
        const selected=diarySelectedCatId||getActiveCatId();
        const cat=selected!=="all"?(cats.find(c=>c.id===selected)||getActiveCat()):getActiveCat();
        if(!cat){renderEmptyState();return;}
        content.innerHTML=`<div class="history-header"><button class="back-button" onclick="renderApp()">← Назад</button><h1>Дневник</h1></div>${createDiaryCatSwitcher()}${createDiaryModeSwitcher()}${renderDiaryCalendar()}`;
    };
    const oldCreate=window.createDiaryModeSwitcher;
    window.createDiaryModeSwitcher=function(){return oldCreate();};
    document.addEventListener("DOMContentLoaded",()=>{
        // Remove any legacy standalone health controls if an older script added one.
        document.querySelectorAll("[data-health-screen], .health-screen-button, .health-dashboard-button").forEach(el=>el.remove());
    });
})();
