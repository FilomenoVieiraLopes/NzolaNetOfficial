import { Routes } from '@angular/router';
import { PesquisarComponent } from './components/pesquisar/pesquisar.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { HomeComponent } from './components/home/home.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { RegistrarComponent } from './components/registrar/registrar.component';
import { LoginComponent } from './components/login/login.component';
import { RecuperarSenhaComponent } from './components/recuperar-senha/recuperar-senha.component';
import { RedefinirSenhaComponent } from './components/redefinir-senha/redefinir-senha.component';
import { NotificacaoComponent } from './components/notificacao/notificacao.component';
import { EditarPerfilComponent } from './components/editar-perfil/editar-perfil.component';
import { DefinicaoComponent } from './components/definicao/definicao.component';
import { CriarPostComponent } from './components/criarPost/criarPost.component';
import { ComentarioComponent } from './components/comentario/comentario.component';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  // Landing Page (Página Inicial quando deslogado)
  {
    path: '',
    component: LandingPageComponent,
    canActivate: [noAuthGuard],
    pathMatch: 'full'
  },
  // Registro
  {
    path: 'registrar',
    component: RegistrarComponent,
    canActivate: [noAuthGuard]
  },
  // Login
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard]
  },
  {
    path: 'recuperar-senha',
    component: RecuperarSenhaComponent,
    canActivate: [noAuthGuard]
  },
  {
    path: 'redefinir-senha',
    component: RedefinirSenhaComponent,
    canActivate: [noAuthGuard]
  },


  // Sistema (Com Sidebar/Navbar do MainLayout)
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent,
      },
      {
        path: 'pesquisar',
        component: PesquisarComponent,
      },
      {
        path: 'explorar',
        component: PesquisarComponent,
      },
      {
        path: 'perfil',
        component: PerfilComponent,
      },
      {
        path: 'perfil/:id',
        component: PerfilComponent,
      },
      {
        path: 'notificacoes',
        component: NotificacaoComponent,
      },
      {
        path: 'editar-perfil',
        component: EditarPerfilComponent,
      },
      {
        path: 'definicao',
        component: DefinicaoComponent,
      },
      {
        path: 'criar-post',
        component: CriarPostComponent,
      },
      {
        path: 'comentario',
        component: ComentarioComponent,
      },
    
      // Redireciona 'app' sozinho para 'app/home'
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ],
  },
  // Redireciona qualquer rota inválida de volta à landing page
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
