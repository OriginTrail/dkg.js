import sinon from 'sinon';

/**
 * Stub a method on an object, creating the property first if it doesn't
 * exist. This avoids Sinon's "Cannot stub non-existent property" error
 * for methods that only appear on certain service implementations.
 */
export function safeStub(obj, method, resolveValue) {
    if (typeof obj[method] !== 'function') {
        obj[method] = () => {};
    }
    return sinon.stub(obj, method).resolves(resolveValue);
}
