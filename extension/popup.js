const $=id=>document.getElementById(id);
$('openWorkspace').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('workspace.html')}));
$('openAdmin').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('admin.html')}));