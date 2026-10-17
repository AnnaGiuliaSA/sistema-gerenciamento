let houveFalhaArmazenamento = false;

function registrarFalha(operacao, chave, error) {
    houveFalhaArmazenamento = true;
    console.error(`Could not ${operacao} local storage key "${chave}".`, error);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('localstorageerror'));
    }
}

export function lerArmazenamento(chave) {
    try {
        return localStorage.getItem(chave);
    } catch (error) {
        registrarFalha('read', chave, error);
        return null;
    }
}

export function gravarArmazenamento(chave, valor) {
    try {
        localStorage.setItem(chave, valor);
        return true;
    } catch (error) {
        registrarFalha('write', chave, error);
        return false;
    }
}

export function removerArmazenamento(chave) {
    try {
        localStorage.removeItem(chave);
        return true;
    } catch (error) {
        registrarFalha('remove', chave, error);
        return false;
    }
}

export function armazenamentoIndisponivel() {
    return houveFalhaArmazenamento;
}
