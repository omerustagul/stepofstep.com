
const Privacy = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Gizlilik Politikası</h1>
            <div className="prose max-w-none text-zinc-600 space-y-4">
                <p>Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">1. Veri Toplama</h3>
                <p>
                    Step Of Step olarak gizliliğinize önem veriyoruz. Sitemizi ziyaret ettiğinizde, iletişim formlarını doldurduğunuzda veya hizmetlerimizi kullandığınızda adınız, e-posta adresiniz ve telefon numaranız gibi temel bilgileri toplayabiliriz.
                </p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">2. Verilerin Kullanımı</h3>
                <p>
                    Toplanan bilgiler, size daha iyi hizmet sunmak, taleplerinize yanıt vermek ve yasal yükümlülüklerimizi yerine getirmek amacıyla kullanılır.
                </p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">3. Çerezler (Cookies)</h3>
                <p>
                    Kullanıcı deneyimini geliştirmek için çerezler kullanmaktayız. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.
                </p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">4. Üçüncü Taraflarla Paylaşım</h3>
                <p>
                    Kişisel verileriniz, yasal zorunluluklar haricinde üçüncü taraflarla paylaşılmaz.
                </p>

                <h3 className="text-xl font-bold text-zinc-900 mt-6">5. Haklarınız</h3>
                <p>
                    KVKK kapsamında verilerinizin silinmesini veya düzeltilmesini talep etme hakkına sahipsiniz.
                </p>
            </div>
        </div>
    );
};

export default Privacy;
