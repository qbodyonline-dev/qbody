export const metadata = {
  title: 'Account & Data Deletion — QBody',
  description: 'How to delete your QBody account and all associated data.',
}

export default function DeleteAccountPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-zinc-800 dark:text-zinc-200">
      {/* English */}
      <h1 className="text-3xl font-bold mb-1">Account &amp; Data Deletion</h1>
      <p className="text-zinc-500 mb-8">QBody — com.qbody.app</p>

      <section className="space-y-3 mb-10">
        <h2 className="text-xl font-semibold">How to delete your account</h2>
        <p>You can permanently delete your QBody account and all associated data at any time:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>In the app:</strong> open <em>Profile → Delete account</em> and confirm.</li>
          <li><strong>On the web:</strong> sign in at <a className="text-teal-600 underline" href="https://qbodyfit.com/client/profile">qbodyfit.com</a>, open your Profile and choose <em>Delete account</em>.</li>
          <li><strong>By email:</strong> if you cannot sign in, email <a className="text-teal-600 underline" href="mailto:support@qbodyfit.com">support@qbodyfit.com</a> from your account email address with the subject &quot;Delete my account&quot;. We will verify and delete it.</li>
        </ul>
      </section>

      <section className="space-y-3 mb-12">
        <h2 className="text-xl font-semibold">What is deleted</h2>
        <p>
          Deleting your account permanently removes your profile and login, training progress and
          workout logs, check-ins and photos, nutrition logs, questionnaire answers, course and
          program access, and order history. This action cannot be undone. Deletion is completed
          within 30 days. Some records may be retained only where required by law (e.g. payment and
          tax records).
        </p>
      </section>

      <hr className="my-12 border-zinc-200 dark:border-zinc-700" />

      {/* Русский */}
      <h1 className="text-3xl font-bold mb-1">Удаление аккаунта и данных</h1>
      <p className="text-zinc-500 mb-8">QBody — com.qbody.app</p>

      <section className="space-y-3 mb-10">
        <h2 className="text-xl font-semibold">Как удалить аккаунт</h2>
        <p>Вы можете в любой момент безвозвратно удалить аккаунт QBody и все связанные с ним данные:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>В приложении:</strong> откройте <em>Профиль → Удалить аккаунт</em> и подтвердите.</li>
          <li><strong>На сайте:</strong> войдите на <a className="text-teal-600 underline" href="https://qbodyfit.com/client/profile">qbodyfit.com</a>, откройте Профиль и выберите <em>Удалить аккаунт</em>.</li>
          <li><strong>По email:</strong> если не удаётся войти — напишите на <a className="text-teal-600 underline" href="mailto:support@qbodyfit.com">support@qbodyfit.com</a> с адреса вашего аккаунта, тема &quot;Удалить мой аккаунт&quot;. Мы проверим и удалим его.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Что удаляется</h2>
        <p>
          Удаление аккаунта безвозвратно стирает профиль и данные входа, прогресс тренировок и логи,
          чек-ины и фотографии, журнал питания, ответы анкеты, доступ к курсам и программам, а также
          историю заказов. Действие необратимо. Удаление выполняется в течение 30 дней. Отдельные
          записи могут храниться только если этого требует закон (например, платёжные и налоговые
          данные).
        </p>
      </section>
    </main>
  )
}
