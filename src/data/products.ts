import { Product } from '@/types/product';
import sofaImage from '@/assets/sofa-modern.jpg';
import diningTableImage from '@/assets/dining-table.jpg';
import armchairImage from '@/assets/armchair-leather.jpg';
import bedroomSetImage from '@/assets/bedroom-set.jpg';
import officeDeskImage from '@/assets/office-desk.jpg';

export const products: Product[] = [
  {
    id: '1',
    name: 'Modern Sectional Sofa',
    price: 1299,
    originalPrice: 1599,
    image: sofaImage,
    category: 'Living Room',
    description: 'Experience ultimate comfort with our modern sectional sofa. Crafted with premium beige fabric and solid walnut legs, this piece combines style and functionality perfectly.',
    inStock: true,
    rating: 4.8,
    reviews: 127,
    features: ['Premium fabric upholstery', 'Solid walnut legs', 'Removable cushions', 'Modular design']
  },
  {
    id: '2',
    name: 'Walnut Dining Table Set',
    price: 899,
    image: diningTableImage,
    category: 'Dining Room',
    description: 'Elegant walnut dining table that seats 6 people comfortably. The rich wood grain and modern design make it perfect for both everyday meals and special occasions.',
    inStock: true,
    rating: 4.9,
    reviews: 89,
    features: ['Solid walnut construction', 'Seats 6 people', 'Scratch-resistant finish', 'Modern minimalist design']
  },
  {
    id: '3',
    name: 'Luxury Leather Armchair',
    price: 699,
    originalPrice: 899,
    image: armchairImage,
    category: 'Living Room',
    description: 'Sink into luxury with our premium leather armchair. The rich brown leather and classic design with modern touches create the perfect reading or relaxation spot.',
    inStock: true,
    rating: 4.7,
    reviews: 156,
    features: ['Genuine leather upholstery', 'Solid wood frame', 'High-density foam cushioning', 'Swivel base']
  },
  {
    id: '4',
    name: 'Scandinavian Bedroom Set',
    price: 1599,
    image: bedroomSetImage,
    category: 'Bedroom',
    description: 'Complete bedroom transformation with our Scandinavian-inspired set. Includes king bed, two nightstands, and dresser in beautiful white oak finish.',
    inStock: true,
    rating: 4.6,
    reviews: 94,
    features: ['White oak finish', 'King size bed included', '2 nightstands', 'Matching dresser']
  },
  {
    id: '5',
    name: 'Contemporary Office Desk',
    price: 549,
    image: officeDeskImage,
    category: 'Office',
    description: 'Boost your productivity with our contemporary office desk. The walnut wood surface and steel legs provide durability and style for your workspace.',
    inStock: false,
    rating: 4.5,
    reviews: 73,
    features: ['Walnut wood surface', 'Steel legs', 'Cable management', 'Spacious design']
  },
  {
    id: '6',
    name: 'Velvet Accent Chair',
    price: 399,
    image: armchairImage,
    category: 'Living Room',
    description: 'Add a pop of elegance with our velvet accent chair. The deep emerald color and gold legs make it a statement piece for any room.',
    inStock: true,
    rating: 4.4,
    reviews: 62,
    features: ['Velvet upholstery', 'Gold-finished legs', 'Comfortable padding', 'Easy assembly']
  }
];

export const categories = [
  'All',
  'Living Room',
  'Dining Room',
  'Bedroom',
  'Office'
];