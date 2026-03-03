export function makeJsonLdProduct({ id = 1, name = 'DKG Test Product' } = {}) {
    return {
        public: {
            '@context': 'http://schema.org',
            '@type': 'Product',
            '@id': `http://example.org/product/${id}`,
            name,
            description: `Auto-generated test product ${id}`,
        },
    };
}

export function makePrivateContent({ serialNumber = 'SECRET-00001' } = {}) {
    return {
        public: {
            '@context': 'http://schema.org',
            '@type': 'Product',
            '@id': 'http://example.org/product/private',
            name: 'Private Product',
        },
        private: {
            '@context': 'http://schema.org',
            '@type': 'Product',
            '@id': 'http://example.org/product/private',
            serialNumber,
        },
    };
}
