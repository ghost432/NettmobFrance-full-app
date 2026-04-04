import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Clock, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_URL.replace('/api', '');

// Social share helpers
const shareLinks = (url, title) => [
    {
        name: 'Facebook',
        color: '#1877F2',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
        ),
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        name: 'Twitter / X',
        color: '#000000',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
        name: 'LinkedIn',
        color: '#0A66C2',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" />
            </svg>
        ),
        href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    },
    {
        name: 'WhatsApp',
        color: '#25D366',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
        ),
        href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    },
    {
        name: 'TikTok',
        color: '#010101',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.76a4.85 4.85 0 01-1.02-.07z" />
            </svg>
        ),
        href: `https://www.tiktok.com/`,
    },
    {
        name: 'Instagram',
        color: '#E1306C',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path fill="white" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        href: `https://www.instagram.com/`,
    },
];

const BlogPost = ({ type }) => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [voted, setVoted] = useState(null); // 'yes' | 'no'
    const [voteLoading, setVoteLoading] = useState(false);
    const [votes, setVotes] = useState({ yes: 0, no: 0 });

    const isEnterprise = type === 'enterprise';
    useDocumentTitle(post ? `${post.title} — NettmobFrance` : 'Article — NettmobFrance');

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/blog/${slug}`);
                if (!res.ok) throw new Error('Not found');
                const data = await res.json();
                setPost(data);
                setVotes({ yes: data.helpful_yes || 0, no: data.helpful_no || 0 });

                const relRes = await fetch(`${API_URL}/blog?type=${type}&limit=5`);
                const relData = await relRes.json();
                setRelated(relData.filter(p => (p.slug || String(p.id)) !== slug).slice(0, 3));

                // Restore vote from localStorage
                const savedVote = localStorage.getItem(`blog_vote_${slug}`);
                if (savedVote) setVoted(savedVote);
            } catch (err) {
                console.error('Error fetching blog post:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
        window.scrollTo(0, 0);
    }, [slug, type]);

    const handleVote = async (vote) => {
        if (voted || voteLoading) return;
        setVoteLoading(true);
        try {
            const res = await fetch(`${API_URL}/blog/${slug}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vote }),
            });
            const data = await res.json();
            if (data.success) {
                setVoted(vote);
                setVotes({ yes: data.helpful_yes, no: data.helpful_no });
                localStorage.setItem(`blog_vote_${slug}`, vote);
            }
        } catch (err) {
            console.error('Vote error:', err);
        } finally {
            setVoteLoading(false);
        }
    };

    const getImageSrc = (p) => {
        if (!p?.image_url) return null;
        if (p.image_url.startsWith('http')) return p.image_url;
        return `${BACKEND_URL}${p.image_url}`;
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    const estimateReadTime = (content) => {
        if (!content) return 1;
        const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    };

    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const backLink = isEnterprise ? '/entreprise/blog' : '/blog';
    const backLabel = isEnterprise ? 'Blog Entreprise' : 'Blog Auto-Entrepreneur';

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="pt-40 pb-20 container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
                        <div className="h-4 bg-muted rounded-full w-1/4"></div>
                        <div className="h-10 bg-muted rounded-2xl w-4/5"></div>
                        <div className="h-80 bg-muted rounded-3xl"></div>
                        <div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 bg-muted rounded-full w-full"></div>)}</div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="pt-40 pb-20 container mx-auto px-4 text-center">
                    <p className="text-6xl mb-4">🔍</p>
                    <h1 className="text-3xl font-black mb-4">Article introuvable</h1>
                    <Link to={backLink} className="text-primary font-bold hover:underline">← Retour au blog</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const imgSrc = getImageSrc(post);

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />

            {/* Back link */}
            <div className="pt-40 pb-0">
                <div className="container mx-auto px-4">
                    <Link
                        to={backLink}
                        className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider mb-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {backLabel}
                    </Link>
                </div>
            </div>

            {/* Article Hero */}
            <section className="pb-10">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 mb-5">
                            <span className="bg-primary text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                                {post.type === 'enterprise' ? 'Entreprise' : 'Auto-Entrepreneur'}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-bold">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(post.created_at)}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-bold">
                                <Clock className="h-3.5 w-3.5" />
                                {estimateReadTime(post.content)} min de lecture
                            </span>
                        </div>

                        {/* Title — lowercase, compact */}
                        <h1 className="text-3xl lg:text-4xl font-black text-foreground mb-5 leading-tight">
                            {post.title}
                        </h1>

                        {/* Excerpt */}
                        {post.excerpt && (
                            <p className="text-lg text-muted-foreground font-semibold leading-relaxed mb-8 border-l-4 border-primary pl-5 italic">
                                {post.excerpt}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Featured Image */}
            {imgSrc && (
                <section className="pb-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="rounded-[2rem] overflow-hidden h-72 lg:h-[420px] shadow-2xl bg-muted">
                                <img
                                    src={imgSrc}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Article Content */}
            <section className="pb-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div
                            className="
                text-base leading-8 font-medium text-muted-foreground
                [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-foreground [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3
                [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-foreground [&_h3]:tracking-tight [&_h3]:mt-6 [&_h3]:mb-2
                [&_p]:mb-5
                [&_strong]:text-foreground [&_strong]:font-black
                [&_a]:text-primary [&_a]:font-bold [&_a]:underline
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_li]:mb-1.5
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:rounded-r-2xl [&_blockquote]:italic [&_blockquote]:my-6 [&_blockquote]:text-foreground
              "
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>
                </div>
            </section>

            {/* Helpfulness Vote */}
            <section className="pb-10">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card border border-border rounded-[2rem] p-8 text-center space-y-5">
                            <h3 className="text-xl font-black text-foreground tracking-tight">
                                Cet article vous a été utile ?
                            </h3>
                            {voted ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2 text-primary font-black text-lg">
                                        <Check className="h-6 w-6" />
                                        Merci pour votre retour !
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {votes.yes} personne{votes.yes !== 1 ? 's' : ''} ont trouvé cet article utile · {votes.no} non
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => handleVote('yes')}
                                        disabled={voteLoading}
                                        className="flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-green-500 text-white font-black text-sm uppercase tracking-wider hover:bg-green-600 transition-all hover:scale-105 shadow-md disabled:opacity-60"
                                    >
                                        <ThumbsUp className="h-5 w-5" />
                                        Oui
                                    </button>
                                    <button
                                        onClick={() => handleVote('no')}
                                        disabled={voteLoading}
                                        className="flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-red-500 text-white font-black text-sm uppercase tracking-wider hover:bg-red-600 transition-all hover:scale-105 shadow-md disabled:opacity-60"
                                    >
                                        <ThumbsDown className="h-5 w-5" />
                                        Non
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Sharing */}
            <section className="pb-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card border border-border rounded-[2rem] p-8">
                            <h3 className="text-lg font-black text-foreground tracking-tight mb-6 uppercase text-center">
                                Partager cet article
                            </h3>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {shareLinks(pageUrl, post.title).map(({ name, color, icon, href }) => (
                                    <a
                                        key={name}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`Partager sur ${name}`}
                                        style={{ backgroundColor: color }}
                                        className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-white font-black text-sm hover:opacity-90 hover:scale-105 transition-all shadow-sm"
                                    >
                                        {icon}
                                        <span className="hidden sm:inline">{name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Articles */}
            {related.length > 0 && (
                <section className="py-16 bg-muted/30 border-t border-border">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-black text-foreground tracking-tight mb-10">
                            Articles <span className="text-primary">similaires</span>
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {related.map((relPost) => {
                                const relImg = getImageSrc(relPost);
                                return (
                                    <Link
                                        key={relPost.id}
                                        to={isEnterprise ? `/entreprise/blog/${relPost.slug || relPost.id}` : `/blog/${relPost.slug || relPost.id}`}
                                        className="group bg-card border border-border rounded-[2rem] overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-500 hover:-translate-y-1"
                                    >
                                        <div className="h-44 overflow-hidden bg-muted">
                                            {relImg ? (
                                                <img
                                                    src={relImg}
                                                    alt={relPost.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-4xl">📰</div>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <div className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(relPost.created_at)}
                                            </div>
                                            <h3 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2 mb-2">
                                                {relPost.title}
                                            </h3>
                                            {(relPost.excerpt || relPost.content) && (
                                                <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-3">
                                                    {relPost.excerpt
                                                        ? relPost.excerpt.split(' ').slice(0, 20).join(' ') + (relPost.excerpt.split(' ').length > 20 ? '…' : '')
                                                        : relPost.content.replace(/<[^>]*>/g, '').split(' ').slice(0, 20).join(' ') + '…'
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
};

export default BlogPost;
