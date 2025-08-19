package com.showroom.management.config;

import com.showroom.management.security.JwtAuthenticationEntryPoint;
import com.showroom.management.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // PUBLIC: HTML pages (no authentication needed)
                        .requestMatchers("/", "/app", "/login", "/index").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/assets/**", "/static/**").permitAll()
                        .requestMatchers("/images/**", "/fonts/**", "/icons/**").permitAll()

                        // Common web resources
                        .requestMatchers("/favicon.ico", "/robots.txt", "/sitemap.xml").permitAll()

                        // Error pages and health checks
                        .requestMatchers("/error", "/actuator/health", "/actuator/info").permitAll()

                        // API Authentication endpoint
                        .requestMatchers("/api/auth/**").permitAll()

                        // Health checks
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()

                        // Role-based API access
                        .requestMatchers("/api/admin/**").hasRole("OWNER")
                        .requestMatchers("/api/manager/**").hasAnyRole("OWNER", "MANAGER")
                        .requestMatchers("/api/salary/**").hasRole("OWNER")
                        .requestMatchers("/api/users/**").hasAnyRole("OWNER", "MANAGER", "SALES")
                        .requestMatchers("/api/sales/**").hasAnyRole("OWNER", "MANAGER", "SALES")
                        .requestMatchers("/api/expenses/**").hasAnyRole("OWNER", "MANAGER")

                        // All other requests require authentication
                        .anyRequest().authenticated()
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow specific origins in production, use patterns for development
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        // For production, replace with specific origins:
        // configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "https://yourdomain.com"));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}