import React from 'react';
import Card from '../../components/Card.jsx';
import CategoryHeader from './CategoryHeader.jsx';

export default function CategoryEmpty({ category }) {
  const isPersonal = category.id === 'personalizados';
  return (
    <main className="sepect-bg topic-page">
      <div className="topic-page__inner">
        <CategoryHeader category={category} />
        <Card
          className="library__empty"
          title={isPersonal ? 'Aún no tienes temas' : 'Próximamente'}
        >
          <p>
            {isPersonal
              ? 'Crea tu primer tema desde la biblioteca y aparecerá aquí.'
              : 'Aún no hay contenido en esta categoría.'}
          </p>
          {isPersonal ? <a className="btn-neon" href="#/">Ir a la biblioteca</a> : null}
        </Card>
      </div>
    </main>
  );
}
