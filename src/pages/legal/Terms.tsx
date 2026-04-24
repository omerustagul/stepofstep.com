
const Terms = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Kullanım Şartları</h1>
            <div className="prose max-w-none text-zinc-600 space-y-4">
                <p>Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">1. Giriş</h3>
                <p>
                    Step Of Step web sitesine hoş geldiniz. Hizmetlerimizi kullanarak bu şartları kabul etmiş sayılırsınız.
                </p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">2. Hizmetlerin Kullanımı</h3>
                <p>
                    Sitemizi yasalara uygun şekilde kullanmayı kabul edersiniz. Zararlı içerik yüklemek, site güvenliğini tehdit etmek veya diğer kullanıcıların haklarını ihlal etmek yasaktır.
                </p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">3. Fikri Mülkiyet</h3>
                <p>
                    Sitedeki tüm içerik (logo, metinler, görseller) Step Of Step'e aittir ve izinsiz kopyalanamaz.
                </p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">4. Sorumluluk Reddi</h3>
                <p>
                    Hizmetlerimiz "olduğu gibi" sunulmaktadır. Step Of Step, sitedeki olası kesintiler veya hatalar konusunda garanti vermez.
                </p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">5. İletişim</h3>
                <p>
                    Sorularınız için bizimle <a href="mailto:info@stepofstep.com" className="text-orange-500 underline">info@stepofstep.com</a> adresinden iletişime geçebilirsiniz.
                </p>
            </div>
        </div>
    );
};

export default Terms;
