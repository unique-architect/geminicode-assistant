(function () {
  const vscode = acquireVsCodeApi();

  const threadSidebar = document.getElementById('threadSidebar');
  const messageList = document.getElementById('messageList');
  const inputArea = document.getElementById('inputArea');
  const messageForm = document.getElementById('messageForm');
  const promptTemplateSelector = document.getElementById('promptTemplateSelector');
  const btnNewThread = document.getElementById('btnNewThread');
  const btnRenameThread = document.getElementById('btnRenameThread');
  const btnDeleteThread = document.getElementById('btnDeleteThread');
  const sendBtn = document.getElementById('sendBtn');
  const retryBtn = document.getElementById('retryBtn');
  const tokenUsageDisplay = document.getElementById('tokenUsage');

  let threads = [];
  let activeThreadId = null;
  let messages = [];
  let promptTemplates = [];
  let isStreaming = false;

  function renderMessageContent(content) {
    return marked.parse(content, {
      highlight: (code, lang) => {
        try {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
        } catch (e) {}
        return code;
      },
    });
  }

  function renderThreadSidebar() {
    threadSidebar.innerHTML = '';
    threads.forEach((thread) => {
      const div = document.createElement('div');
      div.className = 'threadItem';
      if (thread.id === activeThreadId) div.classList.add('active');
      div.textContent = thread.title;
      div.onclick = () => {
        vscode.postMessage({ command: 'switchThread', threadId: thread.id });
      };
      threadSidebar.appendChild(div);
    });

    const newBtn = document.createElement('button');
    newBtn.textContent = '+ New Chat';
    newBtn.className = 'newThreadBtn';
    newBtn.onclick = () => vscode.postMessage({ command: 'newThread' });
    threadSidebar.appendChild(newBtn);
  }

  function renderMessages() {
    messageList.innerHTML = '';
    messages.forEach((msg, i) => {
      const div = document.createElement('div');
      div.className = 'message message-' + msg.role;
      div.innerHTML = renderMessageContent(msg.content);
      messageList.appendChild(div);
    });
    scrollToBottom();
  }

  function scrollToBottom() {
    messageList.scrollTop = messageList.scrollHeight;
  }

  function populatePromptTemplates() {
    promptTemplateSelector.innerHTML = '';
    promptTemplates.forEach((template) => {
      const option = document.createElement('option');
      option.value = template.name;
      option.textContent = template.name;
      promptTemplateSelector.appendChild(option);
    });
  }

  function resetUIState() {
    retryBtn.hidden = true;
    sendBtn.disabled = false;
    inputArea.disabled = false;
    tokenUsageDisplay.textContent = '';
  }

  messageForm.onsubmit = (e) => {
    e.preventDefault();
    if (isStreaming) return; // prevent sending while streaming

    const text = inputArea.value.trim();
    if (!text) return;

    const promptTemplateName = promptTemplateSelector.value;

    vscode.postMessage({
      command: 'sendMessage',
      text,
      threadId: activeThreadId,
      promptTemplateName,
    });

    inputArea.value = '';
    sendBtn.disabled = true;
    inputArea.disabled = true;
    retryBtn.hidden = true;
    isStreaming = true;
  };

  retryBtn.onclick = () => {
    retryBtn.hidden = true;
    vscode.postMessage({ command: 'retry', threadId: activeThreadId });
    sendBtn.disabled = true;
    inputArea.disabled = true;
    isStreaming = true;
  };

  btnNewThread.onclick = () => vscode.postMessage({ command: 'newThread' });
  btnRenameThread.onclick = async () => {
    const newName = prompt('Enter new thread title');
    if (newName) {
      vscode.postMessage({ command: 'renameThread', threadId: activeThreadId, newTitle: newName });
    }
  };
  btnDeleteThread.onclick = () => {
    if (confirm('Delete current thread?')) {
      vscode.postMessage({ command: 'deleteThread', threadId: activeThreadId });
    }
  };

  window.addEventListener('message', (event) => {
    const data = event.data;

    switch (data.command) {
      case 'refresh':
        threads = data.threads;
        activeThreadId = data.activeThreadId;
        messages = data.messages;
        promptTemplates = data.promptTemplates || [];
        renderThreadSidebar();
        renderMessages();
        populatePromptTemplates();
        if (data.resetScroll !== false) scrollToBottom();
        resetUIState();
        isStreaming = false;
        break;
      case 'tokenUsage':
        tokenUsageDisplay.textContent = `Tokens used: ${data.count}`;
        break;
    }
  });
})();
