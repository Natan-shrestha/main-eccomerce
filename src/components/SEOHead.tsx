import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  product?: {
    price?: number;
    currency?: string;
    availability?: 'in stock' | 'out of stock';
    condition?: 'new' | 'used' | 'refurbished';
    brand?: string;
    category?: string;
  };
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Premium Furniture Store - Quality Home Furnishings',
  description = 'Discover our curated collection of premium furniture for every room. Quality craftsmanship, modern designs, and exceptional comfort for your home.',
  keywords = ['furniture', 'home decor', 'interior design', 'modern furniture', 'quality furniture'],
  image = '/hero-furniture.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  product
}) => {
  const siteName = 'FurnitureStore';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  // Generate structured data
  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'product' ? 'Product' : 'WebSite',
      name: siteName,
      url: url,
      description: description,
      image: image
    };

    if (type === 'product' && product) {
      return {
        ...baseData,
        '@type': 'Product',
        name: title,
        description: description,
        image: image,
        brand: product.brand || siteName,
        category: product.category,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency || 'USD',
          availability: product.availability === 'in stock' 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock',
          itemCondition: `https://schema.org/${product.condition === 'new' ? 'NewCondition' : 'UsedCondition'}`
        }
      };
    }

    if (type === 'website') {
      return {
        ...baseData,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${url}/products?search={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      };
    }

    return baseData;
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={url} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Product-specific Open Graph tags */}
      {type === 'product' && product && (
        <>
          <meta property="product:price:amount" content={product.price?.toString()} />
          <meta property="product:price:currency" content={product.currency || 'USD'} />
          <meta property="product:availability" content={product.availability} />
          <meta property="product:condition" content={product.condition} />
          <meta property="product:brand" content={product.brand || siteName} />
          <meta property="product:category" content={product.category} />
        </>
      )}

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(generateStructuredData())}
      </script>

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en-US" />
      
      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Helmet>
  );
};

export default SEOHead;