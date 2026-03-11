// src/app/features/landing/landing.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  // Menú para navegación
  menuItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'testimonios', label: 'Testimonios' },
    { id: 'equipo', label: 'Equipo' },
    { id: 'contacto', label: 'Contacto' }
  ];

  // Estado del scroll
  isScrolled = false;

  // Datos de testimonios
  testimonios = [
    {
      nombre: 'Yguarina',
      texto: 'Empecé con Ruth por problemas de salud para bajar de peso. Lo que más valoro es que desde el primer día personalizó el plan incluyendo todas mis restricciones médicas, convirtiendo una dieta tediosa en un cambio de hábitos natural. Perdí 10 kilos sin apenas darme cuenta. Después, para evitar la flacidez, comenzamos a tonificar el cuerpo. Su trato cercano y su forma de animarme han hecho que, sin ser consciente, haya perdido 20 kilos. El otro día me probé ropa del año pasado y no podía creer que ahora me sobra espacio. Hoy me siento sana y fuerte, que era mi prioridad. Ha sido mi tabla de salvación.',
      estrellas: 5
    },
    {
      nombre: 'Rosana Rodríguez',
      texto: 'Con 24 años y habiendo probado dietas desde los 14 (todas sin éxito, recuperando siempre el peso), llegué con miedo a Ruth. Para mi sorpresa, conectamos al instante. Me dio un plan para aprender a comer sano, sin pastillas, sin pasar hambre y permitiéndome alimentos que antes estaban prohibidos (¡como el pan!). En 4 meses bajé de 70 a 57 kilos y, por primera vez, NO HE RECUPERADO EL PESO. Como entrenadora es "Terminator": sus ejercicios parecen sencillos, pero al día siguiente no puedes ni moverte de lo efectivos que son. Creo que lo que hace es magia combinada con puro amor.',
      estrellas: 5
    },
    {
      nombre: 'Aida',
      texto: 'Lo que diferencia a Ruth de muchos otros es que es un tratamiento personalizado. Empezando por las dietas; que se adaptan a tus gustos, tu forma de comer y cocinar, adaptándolos a unos hábitos sanos, de manera que sea fácil de llevar y seguir con ella. En lugar de ser una dieta aislada la cual abandonas al llegar a tus objetivos. Seguido de los ejercicios que se adaptan a ti. Espero que todos logren sus objetivos por una vida más sana.',
      estrellas: 5
    },
    {
      nombre: 'Sergio J.',
      texto: 'Ruth Morera es una buena entrenadora.Te da todas las comodidades posibles para ponerte en forma, desde entrenar con ella en tú propia casa, o darte una tabla de ejercicios y hacerlos cuando tengas ganas y cuando quieras (eso sí, primero te enseña a realizarlos correctamente).Además, no necesitas una gran cantidad de material deportivo para ejercitarte, con una esterilla y unas pesas (por ejemplo) te saca una cantidad de ejercicios variados con los que entrenar todo el cuerpo.Verdaderamente les aconsejo que contacten con ella si quieren ponerse en forma, yo estoy muy contento con su trabajo.',
      estrellas: 5
    },
    {
      nombre: 'Rosa y Elaine',
      texto: 'Somos Rosa y Elaine… en un comienzo empezamos con Ruth con el objetivo más bien de hacer algo de deporte… y después de varios intentos en el Gym (fracasados) pensamos que algo tan personal nos haría cumplir, puesto que tienes a alguien esperando por nosotras. El comienzo fue difícil por la poca motivación, cero fondo… pero la verdad que Ruth nos lo puso bastante fácil: por su motivación constante (aún sabiendo que éramos un desastre), la paciencia (por nuestras continuas quejas), su capacidad de sorpresa, porque, cada clase es una aventura nueva con ella y destacar su vinculación personal.',
      estrellas: 5
    },
    {
      nombre: 'Lourdes',
      texto: 'Me alegro de haber encontrado una monitora de Pilates que me cuida y sabe adaptar los ejercicios a mis patologías. Además, hace las clases muy entretenidas y con ejercicios muy variados.',
      estrellas: 5
    }
  ];

  // Equipo
  equipo = [
  {
    nombre: 'Ruth',
    cargo: 'Directora y fundadora',
    desc: 'Técnica superior en dietética, máster en imagen personal e instructora Pilates',
    frase: 'Disfruta de la vida sana y los beneficios que esta aporta',
    foto: 'assets/RuthFoto.png' // Añade esta línea
  },
  {
    nombre: 'Ricardo',
    cargo: 'Instructor de Pilates',
    desc: 'El pilates es una forma de vida. Ayuda a conectar cuerpo y mente',
    frase: 'Con esfuerzo, trabajo y mucha concentración puedes conseguir grandes resultados',
    foto: 'assets/RicardoFoto.png' // Añade esta línea
  },
  {
    nombre: 'Sergio',
    cargo: 'Instructor de Pilates',
    desc: 'Promover el movimiento consciente. Enfoque cercano y motivador',
    frase: 'El Pilates tiene el poder de transformar',
    foto: 'assets/SergioFoto.png' // Añade esta línea
  }
];

  // Estado del menú móvil
  mobileMenuOpen = false;

  ngOnInit() {
    // Comprobar scroll al iniciar
    this.checkScroll();
  }

  ngOnDestroy() {
    // Limpiar si es necesario
  }

  @HostListener('window:scroll')
  checkScroll() {
    // Cuando el scroll sea mayor a 50px, activar el estado
    this.isScrolled = window.scrollY > 50;
  }

  // Scroll suave a secciones
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.mobileMenuOpen = false; // Cerrar menú móvil al hacer clic
    }
  }
}